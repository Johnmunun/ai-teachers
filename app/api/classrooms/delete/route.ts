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

    // Delete related data first
    await prisma.studentClassroom.deleteMany({ where: { classroomId } });
    await prisma.lesson.deleteMany({ where: { classroomId } });
    await prisma.payment.deleteMany({ where: { classroomId } });
    await prisma.classroom.delete({ where: { id: classroomId } });

    revalidatePath('/dashboard/classrooms');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

