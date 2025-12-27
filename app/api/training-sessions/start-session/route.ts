import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { trainingSessionId, moduleId, title } = await req.json();

    if (!trainingSessionId || !moduleId) {
      return NextResponse.json({ 
        error: 'trainingSessionId et moduleId requis' 
      }, { status: 400 });
    }

    const teacherId = (session.user as any).id;

    // Vérifier que la formation appartient à l'enseignant
    const trainingSession = await prisma.trainingSession.findFirst({
      where: { 
        id: trainingSessionId,
        teacherId 
      },
      include: {
        modules: {
          where: { id: moduleId }
        }
      }
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 });
    }

    if (!trainingSession.modules || trainingSession.modules.length === 0) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    // Pour l'instant, on retourne juste un succès
    // Vous pouvez créer un système de sessions de formation si nécessaire
    // ou créer un Classroom temporaire pour cette session

    return NextResponse.json({ 
      success: true, 
      lessonId: `training-${trainingSessionId}-${moduleId}`,
      message: 'Session de formation démarrée'
    });
  } catch (error) {
    console.error('Error starting training session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

