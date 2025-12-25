import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Récupérer les sessions de révision de l'étudiant
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const revisions = await prisma.revisionSession.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer ou mettre à jour une session de révision
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { topic, questionsAsked, score, duration, completed } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'topic requis' }, { status: 400 });
    }

    const revisionSession = await prisma.revisionSession.create({
      data: {
        studentId: userId,
        topic,
        questionsAsked: questionsAsked || [],
        score: score || null,
        duration: duration || null,
        completedAt: completed ? new Date() : null
      }
    });

    return NextResponse.json({ success: true, revisionSession });
  } catch (error) {
    console.error('Error creating revision:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour une session de révision existante
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { revisionId, questionsAsked, score, duration, completed } = await req.json();

    if (!revisionId) {
      return NextResponse.json({ error: 'revisionId requis' }, { status: 400 });
    }

    // Vérifier que la session appartient à l'utilisateur
    const existing = await prisma.revisionSession.findFirst({
      where: { id: revisionId, studentId: userId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    const revisionSession = await prisma.revisionSession.update({
      where: { id: revisionId },
      data: {
        questionsAsked: questionsAsked || existing.questionsAsked,
        score: score !== undefined ? score : existing.score,
        duration: duration !== undefined ? duration : existing.duration,
        completedAt: completed ? new Date() : existing.completedAt
      }
    });

    return NextResponse.json({ success: true, revisionSession });
  } catch (error) {
    console.error('Error updating revision:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

