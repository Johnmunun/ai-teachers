import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';

const CreateQuizSchema = z.object({
    type: z.literal('create'),
    lessonId: z.string().uuid('ID de leçon invalide'),
    question: z.string().min(1, 'La question est requise'),
    options: z.array(z.string().min(1)).min(2, 'Au moins 2 options sont requises'),
    correctAnswer: z.string().min(1, 'La réponse correcte est requise'),
});

const ResponseQuizSchema = z.object({
    type: z.literal('response'),
    quizId: z.string().uuid('ID de quiz invalide'),
    studentId: z.string().uuid('ID d\'étudiant invalide'),
    answer: z.string().min(1, 'La réponse est requise'),
});

const QuizRequestSchema = z.discriminatedUnion('type', [
    CreateQuizSchema,
    ResponseQuizSchema,
]);

// POST: Create a quiz (Teacher) or Save response (Student)
export async function POST(req: Request) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validation = QuizRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;
        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        if (data.type === 'create') {
            // Vérifier que l'utilisateur est un enseignant
            if (userRole !== 'TEACHER') {
                return NextResponse.json(
                    { error: 'Seuls les enseignants peuvent créer des quiz' },
                    { status: 403 }
                );
            }

            // Vérifier que la leçon existe et que l'enseignant en est propriétaire
            const lesson = await prisma.lesson.findUnique({
                where: { id: data.lessonId },
                include: {
                    classroom: {
                        select: {
                            teacherId: true
                        }
                    }
                }
            });

            if (!lesson) {
                return NextResponse.json(
                    { error: 'Leçon non trouvée' },
                    { status: 404 }
                );
            }

            // Vérifier que l'enseignant est propriétaire de la classe
            if (lesson.classroom.teacherId !== userId) {
                return NextResponse.json(
                    { error: 'Vous n\'êtes pas autorisé à créer un quiz pour cette leçon' },
                    { status: 403 }
                );
            }

            // Vérifier que la réponse correcte est dans les options
            if (!data.options.includes(data.correctAnswer)) {
                return NextResponse.json(
                    { error: 'La réponse correcte doit être parmi les options' },
                    { status: 400 }
                );
            }

            const quiz = await prisma.quiz.create({
                data: {
                    lessonId: data.lessonId,
                    question: data.question,
                    options: data.options,
                    correctAnswer: data.correctAnswer,
                },
            });
            return NextResponse.json({ quiz });
        }

        if (data.type === 'response') {
            // Vérifier que l'utilisateur est un étudiant
            if (userRole !== 'STUDENT') {
                return NextResponse.json(
                    { error: 'Seuls les étudiants peuvent répondre aux quiz' },
                    { status: 403 }
                );
            }

            // Vérifier que l'étudiant répond pour lui-même
            if (data.studentId !== userId) {
                return NextResponse.json(
                    { error: 'Vous ne pouvez répondre qu\'à votre propre nom' },
                    { status: 403 }
                );
            }

            // Vérifier que le quiz existe et que l'étudiant est inscrit au cours
            const quiz = await prisma.quiz.findUnique({
                where: { id: data.quizId },
                include: {
                    lesson: {
                        include: {
                            classroom: {
                                include: {
                                    studentClassrooms: {
                                        where: {
                                            studentId: userId
                                        }
                                    }
                                }
                            }
                        }
                    },
                    module: {
                        include: {
                            trainingSession: {
                                include: {
                                    enrollments: {
                                        where: {
                                            studentId: userId
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!quiz) {
                return NextResponse.json(
                    { error: 'Quiz non trouvé' },
                    { status: 404 }
                );
            }

            // Vérifier que l'étudiant est inscrit (soit au cours pour quiz de leçon, soit à la formation pour quiz de module)
            if (quiz.lessonId) {
                // Quiz lié à une leçon (cours rapide)
                if (!quiz.lesson || quiz.lesson.classroom.studentClassrooms.length === 0) {
                    return NextResponse.json(
                        { error: 'Vous n\'êtes pas inscrit à ce cours' },
                        { status: 403 }
                    );
                }
            } else if (quiz.moduleId) {
                // Quiz lié à un module (formation complète)
                if (!quiz.module || quiz.module.trainingSession.enrollments.length === 0) {
                    return NextResponse.json(
                        { error: 'Vous n\'êtes pas inscrit à cette formation' },
                        { status: 403 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'Quiz invalide : ni leçon ni module associé' },
                    { status: 400 }
                );
            }

            // Vérifier si l'étudiant a déjà répondu
            const existingResponse = await prisma.quizResponse.findFirst({
                where: {
                    quizId: data.quizId,
                    studentId: data.studentId,
                },
            });

            if (existingResponse) {
                return NextResponse.json(
                    { error: 'Vous avez déjà répondu à ce quiz' },
                    { status: 400 }
                );
            }

            const isCorrect = quiz.correctAnswer === data.answer;

            const response = await prisma.quizResponse.create({
                data: {
                    quizId: data.quizId,
                    studentId: data.studentId,
                    answer: data.answer,
                    isCorrect,
                },
            });

            return NextResponse.json({
                response,
                isCorrect,
                correctAnswer: quiz.correctAnswer,
            });
        }

        return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    } catch (error: any) {
        console.error('Quiz error:', error);

        // Gestion spécifique des erreurs Prisma
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Cette réponse existe déjà' },
                { status: 400 }
            );
        }

        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: 'Référence invalide (leçon, quiz ou étudiant introuvable)' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur serveur', message: error.message || 'Erreur inconnue' },
            { status: 500 }
        );
    }
}
