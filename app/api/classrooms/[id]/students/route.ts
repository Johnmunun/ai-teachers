import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Récupérer les étudiants d'un cours
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: classroomId } = await params;
    const teacherId = (session.user as any).id;

    // Vérifier que le cours appartient à l'enseignant
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        teacherId
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 });
    }

    // Récupérer tous les étudiants inscrits
    const enrollments = await prisma.studentClassroom.findMany({
      where: { classroomId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            isBlocked: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const students = enrollments.map(e => ({
      id: e.student.id,
      name: e.student.name,
      email: e.student.email,
      isBlocked: e.student.isBlocked
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


