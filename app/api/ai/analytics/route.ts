import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';
import { z } from 'zod';

const AnalyticsRequestSchema = z.object({
    studentId: z.string().uuid(),
    trainingSessionId: z.string().uuid().optional(),
    periodStart: z.string().optional(), // ISO date string
    periodEnd: z.string().optional(), // ISO date string
});

const ANALYTICS_PROMPT = `
Tu es un expert en analyse pédagogique. Analyse les données d'un étudiant et génère des insights pertinents.

Données fournies:
- Progression dans les cours
- Résultats aux quiz
- Temps passé
- Événements de confusion détectés
- Historique des sessions

Génère un rapport JSON avec:
{
  "confusionScore": 0.0-1.0, // Score de confusion moyen
  "engagementScore": 0.0-1.0, // Score d'engagement
  "performanceScore": 0.0-1.0, // Score de performance global
  "strengths": ["Point fort 1", "Point fort 2"], // Points forts identifiés
  "weaknesses": ["Point faible 1", "Point faible 2"], // Points faibles
  "recommendations": ["Recommandation 1", "Recommandation 2"], // Recommandations pédagogiques
  "summary": "Résumé textuel de l'analyse"
}

Sois précis, constructif et pédagogique.
`;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'TEACHER') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const validation = AnalyticsRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { studentId, trainingSessionId, periodStart, periodEnd } = validation.data;

        const startDate = periodStart ? new Date(periodStart) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut
        const endDate = periodEnd ? new Date(periodEnd) : new Date();

        // Récupérer les données de l'étudiant
        const [progressions, quizResponses, confusionEvents, lessons] = await Promise.all([
            // Progressions
            prisma.courseProgression.findMany({
                where: {
                    studentId,
                    ...(trainingSessionId && {
                        course: {
                            module: {
                                trainingSessionId,
                            },
                        },
                    }),
                    lastAccessedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    course: {
                        include: {
                            module: true,
                        },
                    },
                },
            }),

            // Quiz responses
            prisma.quizResponse.findMany({
                where: {
                    studentId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    ...(trainingSessionId && {
                        quiz: {
                            lesson: {
                                classroom: {
                                    id: trainingSessionId, // À adapter selon votre structure
                                },
                            },
                        },
                    }),
                },
                include: {
                    quiz: {
                        include: {
                            lesson: true,
                        },
                    },
                },
            }),

            // Confusion events
            prisma.confusionEvent.findMany({
                where: {
                    studentId,
                    detectedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    lesson: true,
                },
            }),

            // Lessons participées
            prisma.lesson.findMany({
                where: {
                    comprehensionLogs: {
                        some: {
                            studentId,
                        },
                    },
                    startedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    comprehensionLogs: {
                        where: {
                            studentId,
                        },
                    },
                },
            }),
        ]);

        // Calculer les métriques de base
        const totalQuizzes = quizResponses.length;
        const correctQuizzes = quizResponses.filter((r) => r.isCorrect).length;
        const accuracy = totalQuizzes > 0 ? correctQuizzes / totalQuizzes : 0;

        const avgProgress = progressions.length > 0
            ? progressions.reduce((sum, p) => sum + p.progress, 0) / progressions.length
            : 0;

        const totalTimeSpent = progressions.reduce((sum, p) => sum + p.timeSpent, 0);

        const avgConfusionScore = confusionEvents.length > 0
            ? confusionEvents.reduce((sum, e) => sum + e.score, 0) / confusionEvents.length
            : 0;

        // Préparer les données pour l'IA
        const analyticsData = {
            progressions: progressions.map((p) => ({
                courseTitle: p.course.title,
                progress: p.progress,
                timeSpent: p.timeSpent,
            })),
            quizResults: {
                total: totalQuizzes,
                correct: correctQuizzes,
                accuracy,
                details: quizResponses.map((r) => ({
                    question: r.quiz.question,
                    isCorrect: r.isCorrect,
                })),
            },
            confusionEvents: confusionEvents.map((e) => ({
                score: e.score,
                reason: e.reason,
                lessonTitle: e.lesson.title,
            })),
            timeSpent: totalTimeSpent,
            lessonsCount: lessons.length,
        };

        // Générer l'analyse avec l'IA
        if (!process.env.OPENAI_API_KEY) {
            // Retourner une analyse basique si pas d'IA
            return NextResponse.json({
                confusionScore: avgConfusionScore,
                engagementScore: lessons.length > 0 ? 0.7 : 0.5,
                performanceScore: accuracy,
                strengths: [],
                weaknesses: [],
                recommendations: [],
                summary: 'Analyse basique générée',
            });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: ANALYTICS_PROMPT },
                {
                    role: 'user',
                    content: `Analyse ces données d'étudiant:\n\n${JSON.stringify(analyticsData, null, 2)}`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json({ error: 'Erreur lors de la génération de l\'analyse' }, { status: 500 });
        }

        let analyticsResult;
        try {
            analyticsResult = JSON.parse(content);
        } catch {
            analyticsResult = {
                confusionScore: avgConfusionScore,
                engagementScore: 0.7,
                performanceScore: accuracy,
                strengths: [],
                weaknesses: [],
                recommendations: [],
                summary: content,
            };
        }

        // Sauvegarder l'analytics dans la DB
        await prisma.studentAnalytics.create({
            data: {
                studentId,
                trainingSessionId: trainingSessionId || null,
                confusionScore: analyticsResult.confusionScore || avgConfusionScore,
                engagementScore: analyticsResult.engagementScore || 0.7,
                performanceScore: analyticsResult.performanceScore || accuracy,
                strengths: analyticsResult.strengths || [],
                weaknesses: analyticsResult.weaknesses || [],
                recommendations: analyticsResult.recommendations || [],
                periodStart: startDate,
                periodEnd: endDate,
            },
        });

        return NextResponse.json(analyticsResult);
    } catch (error: any) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'analyse', message: error.message },
            { status: 500 }
        );
    }
}

// GET - Récupérer les analytics existantes
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        const trainingSessionId = searchParams.get('trainingSessionId');

        if (!studentId) {
            return NextResponse.json({ error: 'studentId requis' }, { status: 400 });
        }

        // Vérifier que c'est le prof ou l'étudiant lui-même
        const userId = (session.user as any).id;
        const role = (session.user as any).role;

        if (role !== 'TEACHER' && userId !== studentId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const analytics = await prisma.studentAnalytics.findMany({
            where: {
                studentId,
                ...(trainingSessionId && { trainingSessionId }),
            },
            orderBy: {
                calculatedAt: 'desc',
            },
            take: 10,
        });

        return NextResponse.json({ analytics });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

