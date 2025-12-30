import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// GET - Récupérer un étudiant
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

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    // Les étudiants ne peuvent voir que leur propre profil
    if (role === 'STUDENT' && id !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        studentClassrooms: {
          include: {
            classroom: { select: { id: true, title: true } }
          }
        },
        payments: {
          include: {
            classroom: { select: { id: true, title: true } },
            tranches: { orderBy: { paidAt: 'desc' } }
          }
        }
      }
    });

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier un étudiant
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

    const { name, email, phone, isBlocked } = await req.json();

    // Vérifier que l'étudiant existe
    const existing = await prisma.user.findUnique({
      where: { id }
    });

    if (!existing || existing.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    // Mettre à jour l'étudiant
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(isBlocked !== undefined && { isBlocked })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isBlocked: true,
        role: true
      }
    });

    revalidatePath(`/dashboard/students/${id}`);
    revalidatePath('/dashboard/students');

    return NextResponse.json({ 
      success: true, 
      student: updated 
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Cet email est déjà utilisé' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un étudiant
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

    // Vérifier que l'étudiant existe
    const existing = await prisma.user.findUnique({
      where: { id }
    });

    if (!existing || existing.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
    }

    // Supprimer les données liées (en cascade selon le schema)
    // Les relations avec onDelete: Cascade seront supprimées automatiquement
    await prisma.user.delete({ where: { id } });

    revalidatePath('/dashboard/students');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


