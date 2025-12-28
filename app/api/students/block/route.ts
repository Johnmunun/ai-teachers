import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST - Bloquer/Débloquer un étudiant dans un cours en live
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { studentId, lessonId, isBlocked } = await req.json();

    if (!studentId || lessonId === undefined) {
      return NextResponse.json({ 
        error: 'studentId et lessonId requis' 
      }, { status: 400 });
    }

    // Vérifier que la lesson appartient à l'enseignant
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        classroom: {
          teacherId: (session.user as any).id
        }
      },
      include: {
        classroom: true
      }
    });

    if (!lesson) {
      return NextResponse.json({ 
        error: 'Session non trouvée ou non autorisée' 
      }, { status: 404 });
    }

    // Vérifier que l'étudiant est inscrit au cours
    const enrollment = await prisma.studentClassroom.findFirst({
      where: {
        studentId,
        classroomId: lesson.classroomId
      }
    });

    if (!enrollment) {
      return NextResponse.json({ 
        error: 'Étudiant non inscrit à ce cours' 
      }, { status: 404 });
    }

    // Mettre à jour le statut de blocage de l'étudiant
    // Note: On pourrait créer un modèle BlockedStudentInLesson si besoin
    // Pour l'instant, on utilise le champ isBlocked global de l'utilisateur
    // ou on peut créer une table de blocage spécifique par session
    
    // Option 1: Bloquer globalement (simple)
    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: { isBlocked: isBlocked || false }
    });

    // Option 2: On pourrait aussi créer un log de blocage pour cette session
    // Pour l'instant, on utilise l'option 1

    return NextResponse.json({ 
      success: true,
      student: {
        id: updatedUser.id,
        name: updatedUser.name,
        isBlocked: updatedUser.isBlocked
      },
      message: isBlocked 
        ? 'Étudiant bloqué avec succès' 
        : 'Étudiant débloqué avec succès'
    });
  } catch (error) {
    console.error('Error blocking student:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


