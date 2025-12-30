import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST - Inscrire un étudiant à une session
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingSessionId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { studentId } = await req.json();

    // Si enseignant, il peut inscrire n'importe quel étudiant
    // Si étudiant, il ne peut s'inscrire que lui-même
    const targetStudentId = role === 'TEACHER' && studentId ? studentId : userId;

    // Vérifier que la session existe
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingSessionId }
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Vérifier si déjà inscrit
    const existing = await prisma.studentEnrollment.findUnique({
      where: {
        studentId_trainingSessionId: { studentId: targetStudentId, trainingSessionId }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Déjà inscrit à cette session' }, { status: 400 });
    }

    // Créer l'inscription
    const enrollment = await prisma.studentEnrollment.create({
      data: {
        studentId: targetStudentId,
        trainingSessionId,
        totalAmount: trainingSession.totalPrice,
        status: 'PENDING'
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        trainingSession: { select: { title: true } }
      }
    });

    // Créer les tranches planifiées
    const plannedTranches = trainingSession.plannedTranches as any[];
    if (plannedTranches && plannedTranches.length > 0) {
      const startDate = new Date(trainingSession.startDate);
      
      for (const tranche of plannedTranches) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (tranche.dueWeek || 1) * 7);
        
        await prisma.enrollmentTranche.create({
          data: {
            enrollmentId: enrollment.id,
            expectedAmount: (trainingSession.totalPrice * tranche.percent) / 100,
            expectedPercent: tranche.percent,
            dueDate
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      enrollment,
      message: 'Inscription réussie'
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

