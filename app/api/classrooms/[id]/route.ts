import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// GET - Récupérer un cours
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: { select: { name: true, email: true } },
        _count: {
          select: { 
            studentClassrooms: true,
            lessons: true
          }
        }
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error('Error fetching classroom:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier un cours
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teacherId = (session.user as any).id;
    const { title, description, price, isActive } = await req.json();

    // Vérifier que le cours appartient à l'enseignant
    const existing = await prisma.classroom.findFirst({
      where: { 
        id, 
        teacherId 
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 });
    }

    // Mettre à jour le cours
    const updated = await prisma.classroom.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        teacher: { select: { name: true, email: true } }
      }
    });

    revalidatePath(`/dashboard/classrooms/${id}`);
    revalidatePath('/dashboard/classrooms');

    return NextResponse.json({ 
      success: true, 
      classroom: updated 
    });
  } catch (error) {
    console.error('Error updating classroom:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un cours
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teacherId = (session.user as any).id;

    // Vérifier que le cours appartient à l'enseignant
    const existing = await prisma.classroom.findFirst({
      where: { 
        id, 
        teacherId 
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 });
    }

    // Supprimer les données liées (en cascade)
    await prisma.studentClassroom.deleteMany({ where: { classroomId: id } });
    await prisma.lesson.deleteMany({ where: { classroomId: id } });
    await prisma.payment.deleteMany({ where: { classroomId: id } });
    
    // Supprimer le cours
    await prisma.classroom.delete({ where: { id } });

    revalidatePath('/dashboard/classrooms');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
