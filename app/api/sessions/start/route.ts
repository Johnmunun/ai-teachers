import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { classroomId, title, topics, streamingLink } = await req.json();

    if (!classroomId) {
      return NextResponse.json({ error: 'classroomId requis' }, { status: 400 });
    }

    // Verify teacher owns the classroom
    const classroom = await prisma.classroom.findFirst({
      where: { 
        id: classroomId, 
        teacherId: (session.user as any).id 
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 });
    }

    // Create new lesson/session
    const lesson = await prisma.lesson.create({
      data: {
        classroomId,
        title: title || `Session du ${new Date().toLocaleDateString('fr-FR')}`,
        topics: topics || [],
        streamingLink: streamingLink || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      lessonId: lesson.id,
      message: 'Session démarrée'
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


