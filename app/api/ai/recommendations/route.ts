import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';
import { z } from 'zod';
import { getUserMemorySummary } from '@/lib/ai-memory';

const RecommendationsRequestSchema = z.object({
    studentId: z.string().uuid().optional(), // Si non fourni, utilise l'utilisateur actuel
    trainingSessionId: z.string().uuid().optional(),
});

const RECOMMENDATIONS_PROMPT = `
Tu es un expert en pédagogie et en recommandations de parcours d'apprentissage.

Analyse le profil d'un étudiant et génère des recommandations personnalisées.

Format JSON:
{
  "recommendedCourses": [
    {
      "courseId": "id du cours",
      "title": "Titre du cours",
      "reason": "Pourquoi ce cours est recommandé",
      "priority": "high|medium|low"
    }
  ],
  "learningPath": [
    {
      "step": 1,
      "courseId": "id",
      "title": "Titre",
      "description": "Description de l'étape"
    }
  ],
  "revisionSuggestions": [
    {
      "topic": "Sujet à réviser",
      "reason": "Pourquoi réviser ce sujet",
      "resources": ["Ressource 1", "Ressource 2"]
    }
  ],
  "studyTips": ["Conseil 1", "Conseil 2"],
  "summary": "Résumé des recommandations"
}

Sois précis et adapté au profil de l'étudiant.
`;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const validation = RecommendationsRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const userId = (session.user as any).id;
        const role = (session.user as any).role;
        const requestedStudentId = validation.data.studentId || userId;

        // Vérifier les permissions
        if (role !== 'TEACHER' && requestedStudentId !== userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        // Récupérer les données de l'étudiant
        const [progressions, analytics, memorySummary, availableCourses] = await Promise.all([
            // Progressions
            prisma.courseProgression.findMany({
                where: {
                    studentId: requestedStudentId,
                    ...(validation.data.trainingSessionId && {
                        course: {
                            module: {
                                trainingSessionId: validation.data.trainingSessionId,
                            },
                        },
                    }),
                },
                include: {
                    course: {
                        include: {
                            module: {
                                include: {
                                    trainingSession: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    lastAccessedAt: 'desc',
                },
                take: 20,
            }),

            // Analytics récentes
            prisma.studentAnalytics.findFirst({
                where: {
                    studentId: requestedStudentId,
                    ...(validation.data.trainingSessionId && {
                        trainingSessionId: validation.data.trainingSessionId,
                    }),
                },
                orderBy: {
                    calculatedAt: 'desc',
                },
            }),

            // Résumé mémoire
            getUserMemorySummary(requestedStudentId),

            // Cours disponibles
            prisma.course.findMany({
                where: {
                    ...(validation.data.trainingSessionId && {
                        module: {
                            trainingSessionId: validation.data.trainingSessionId,
                        },
                    }),
                },
                include: {
                    module: {
                        include: {
                            trainingSession: true,
                        },
                    },
                    progressions: {
                        where: {
                            studentId: requestedStudentId,
                        },
                    },
                },
                orderBy: {
                    orderIndex: 'asc',
                },
            }),
        ]);

        // Préparer les données pour l'IA
        const studentData = {
            currentProgress: progressions.map((p) => ({
                courseId: p.courseId,
                courseTitle: p.course.title,
                progress: p.progress,
                module: p.course.module.title,
            })),
            analytics: analytics
                ? {
                      confusionScore: analytics.confusionScore,
                      engagementScore: analytics.engagementScore,
                      performanceScore: analytics.performanceScore,
                      strengths: analytics.strengths,
                      weaknesses: analytics.weaknesses,
                  }
                : null,
            memory: memorySummary,
            availableCourses: availableCourses.map((c) => ({
                id: c.id,
                title: c.title,
                moduleTitle: c.module.title,
                estimatedMinutes: c.estimatedMinutes,
                progress: c.progressions[0]?.progress || 0,
            })),
        };

        // Générer les recommandations avec l'IA
        if (!process.env.OPENAI_API_KEY) {
            // Recommandations basiques sans IA
            const nextCourses = availableCourses
                .filter((c) => {
                    const prog = c.progressions[0];
                    return !prog || prog.progress < 100;
                })
                .slice(0, 5)
                .map((c) => ({
                    courseId: c.id,
                    title: c.title,
                    reason: 'Cours disponible dans votre parcours',
                    priority: 'medium' as const,
                }));

            return NextResponse.json({
                recommendedCourses: nextCourses,
                learningPath: [],
                revisionSuggestions: [],
                studyTips: ['Révisez régulièrement', 'Pratiquez les exercices'],
                summary: 'Recommandations basiques générées',
            });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: RECOMMENDATIONS_PROMPT },
                {
                    role: 'user',
                    content: `Génère des recommandations pour cet étudiant:\n\n${JSON.stringify(studentData, null, 2)}`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.8,
            max_tokens: 2000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 });
        }

        let recommendations;
        try {
            recommendations = JSON.parse(content);
        } catch {
            recommendations = {
                recommendedCourses: [],
                learningPath: [],
                revisionSuggestions: [],
                studyTips: [],
                summary: content,
            };
        }

        return NextResponse.json(recommendations);
    } catch (error: any) {
        console.error('Recommendations error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération', message: error.message },
            { status: 500 }
        );
    }
}

