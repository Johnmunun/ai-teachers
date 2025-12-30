import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Récupérer une session spécifique
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

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const trainingSession = await prisma.trainingSession.findFirst({
      where: { 
        id,
        ...(role === 'TEACHER' && { teacherId: userId })
      },
      include: {
        teacher: { select: { name: true, email: true } },
        modules: {
          include: {
            courses: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        schedules: {
          orderBy: { dayOfWeek: 'asc' }
        },
        enrollments: {
          include: {
            student: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ trainingSession });
  } catch (error) {
    console.error('Error fetching training session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour une session
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
    const {
      title,
      description,
      startDate,
      endDate,
      durationWeeks,
      totalPrice,
      currency,
      isActive,
      plannedTranches,
      schedules
    } = await req.json();

    // Vérifier que la session appartient à l'enseignant
    const existing = await prisma.trainingSession.findFirst({
      where: { id, teacherId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Supprimer les anciens horaires
    await prisma.schedule.deleteMany({
      where: { trainingSessionId: id }
    });

    // Mettre à jour la session
    const updated = await prisma.trainingSession.update({
      where: { id },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        durationWeeks: durationWeeks || existing.durationWeeks,
        totalPrice: totalPrice || 0,
        currency: currency || 'XAF',
        isActive: isActive !== undefined ? isActive : existing.isActive,
        plannedTranches: plannedTranches || existing.plannedTranches,
        // Créer les nouveaux horaires
        schedules: schedules ? {
          create: schedules.map((s: any) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            location: s.location || null
          }))
        } : undefined
      },
      include: {
        modules: true,
        schedules: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      trainingSession: updated 
    });
  } catch (error) {
    console.error('Error updating training session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une session
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

    // Vérifier que la session appartient à l'enseignant
    const existing = await prisma.trainingSession.findFirst({
      where: { id, teacherId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Supprimer en cascade (les relations sont configurées avec onDelete: Cascade)
    await prisma.trainingSession.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting training session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

