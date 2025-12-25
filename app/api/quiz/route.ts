import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
        const body = await req.json();
        const validation = QuizRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        if (data.type === 'create') {
            // Vérifier que la leçon existe
            const lesson = await prisma.lesson.findUnique({
                where: { id: data.lessonId },
            });

            if (!lesson) {
                return NextResponse.json(
                    { error: 'Leçon non trouvée' },
                    { status: 404 }
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
            // Vérifier que le quiz existe
            const quiz = await prisma.quiz.findUnique({
                where: { id: data.quizId },
            });

            if (!quiz) {
                return NextResponse.json(
                    { error: 'Quiz non trouvé' },
                    { status: 404 }
                );
            }

            // Vérifier que l'étudiant existe
            const student = await prisma.user.findUnique({
                where: { id: data.studentId },
            });

            if (!student) {
                return NextResponse.json(
                    { error: 'Étudiant non trouvé' },
                    { status: 404 }
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
