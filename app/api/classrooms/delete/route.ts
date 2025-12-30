import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await req.formData();
    const classroomId = formData.get('classroomId') as string;

    if (!classroomId) {
      return NextResponse.json({ error: 'classroomId requis' }, { status: 400 });
    }

    // Vérifier que le cours appartient à l'enseignant
    const classroom = await prisma.classroom.findFirst({
      where: { 
        id: classroomId,
        teacherId: (session.user as any).id
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 });
    }

    // Récupérer toutes les leçons du cours pour supprimer leurs relations
    const lessons = await prisma.lesson.findMany({
      where: { classroomId },
      select: { id: true }
    });

    const lessonIds = lessons.map(l => l.id);

    // Supprimer toutes les données liées aux leçons dans le bon ordre
    if (lessonIds.length > 0) {
      // 1. Récupérer les quiz liés aux leçons
      const quizzes = await prisma.quiz.findMany({
        where: {
          lessonId: { in: lessonIds }
        },
        select: { id: true }
      });

      const quizIds = quizzes.map(q => q.id);

      // 2. Supprimer les réponses aux quiz
      if (quizIds.length > 0) {
        await prisma.quizResponse.deleteMany({
          where: {
            quizId: { in: quizIds }
          }
        });
      }

      // 3. Supprimer les quiz liés aux leçons
      await prisma.quiz.deleteMany({
        where: {
          lessonId: { in: lessonIds }
        }
      });

      // 4. Supprimer les logs de compréhension
      await prisma.comprehensionLog.deleteMany({
        where: {
          lessonId: { in: lessonIds }
        }
      });

      // 5. Supprimer les notes de session
      await prisma.sessionNote.deleteMany({
        where: {
          lessonId: { in: lessonIds }
        }
      });

      // 6. Supprimer les événements de confusion
      await prisma.confusionEvent.deleteMany({
        where: {
          lessonId: { in: lessonIds }
        }
      });
    }

    // 7. Supprimer les leçons
    await prisma.lesson.deleteMany({ where: { classroomId } });

    // 8. Supprimer les inscriptions étudiantes
    await prisma.studentClassroom.deleteMany({ where: { classroomId } });

    // 9. Supprimer les paiements
    await prisma.payment.deleteMany({ where: { classroomId } });

    // 10. Supprimer le cours
    await prisma.classroom.delete({ where: { id: classroomId } });

    revalidatePath('/dashboard/classrooms');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting classroom:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    });
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

