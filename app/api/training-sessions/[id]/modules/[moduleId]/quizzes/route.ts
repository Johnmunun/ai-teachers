import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';

const QuizSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string().min(1),
  type: z.enum(['multiple_choice', 'true_false', 'open_ended']).default('multiple_choice'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

// GET - Récupérer les quiz d'un module
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        moduleId
      },
      include: {
        responses: {
          select: {
            id: true,
            studentId: true,
            isCorrect: true
          }
        },
        _count: {
          select: {
            responses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un quiz pour un module
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teacherId = (session.user as any).id;

    // Vérifier que le module appartient à une formation de l'enseignant
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        trainingSessionId: id,
        trainingSession: {
          teacherId
        }
      }
    });

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    const body = await req.json();
    const validation = QuizSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const quizData = validation.data;

    // Créer le quiz
    const quiz = await prisma.quiz.create({
      data: {
        moduleId,
        question: quizData.question,
        options: quizData.options,
        correctAnswer: quizData.correctAnswer,
        type: quizData.type,
        difficulty: quizData.difficulty || null
      }
    });

    return NextResponse.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


