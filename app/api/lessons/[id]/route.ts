import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        classroom: {
          select: {
            id: true,
            title: true,
            teacherId: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Leçon non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à cette leçon
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    
    if (role === 'TEACHER' && lesson.classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (role === 'STUDENT') {
      const hasAccess = await prisma.studentClassroom.findFirst({
        where: {
          studentId: userId,
          classroomId: lesson.classroomId
        }
      });
      
      if (!hasAccess) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    return NextResponse.json({ 
      id: lesson.id,
      title: lesson.title,
      streamingLink: lesson.streamingLink,
      classroomId: lesson.classroomId,
      startedAt: lesson.startedAt,
      endedAt: lesson.endedAt
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

