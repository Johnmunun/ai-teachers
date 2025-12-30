import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST - Enregistrer un paiement (avec ou sans excuse)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trainingSessionId } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { 
      enrollmentId,
      trancheId,
      amount,
      method,
      reference,
      receivedBy,
      notes,
      // Système d'excuse
      hasExcuse,
      excuseReason
    } = await req.json();

    if (!enrollmentId || amount === undefined) {
      return NextResponse.json({ error: 'enrollmentId et amount requis' }, { status: 400 });
    }

    // Vérifier l'inscription
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { 
        trainingSession: true,
        tranches: { orderBy: { dueDate: 'asc' } }
      }
    });

    if (!enrollment || enrollment.trainingSessionId !== trainingSessionId) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 });
    }

    // Si une tranche spécifique est ciblée
    if (trancheId) {
      const tranche = await prisma.enrollmentTranche.update({
        where: { id: trancheId },
        data: {
          actualAmount: amount,
          hasExcuse: hasExcuse || false,
          excuseReason: hasExcuse ? excuseReason : null,
          excuseApproved: hasExcuse ? null : undefined, // En attente de décision
          method: method || 'CASH',
          reference,
          receivedBy,
          notes,
          paidAt: new Date()
        }
      });

      // Mettre à jour le total payé
      const allTranches = await prisma.enrollmentTranche.findMany({
        where: { enrollmentId }
      });
      
      const totalPaid = allTranches.reduce((sum, t) => sum + t.actualAmount, 0);
      const status = totalPaid >= enrollment.totalAmount 
        ? 'COMPLETED' 
        : totalPaid > 0 
          ? (hasExcuse ? 'EXCUSED' : 'PARTIAL')
          : 'PENDING';

      await prisma.studentEnrollment.update({
        where: { id: enrollmentId },
        data: { 
          paidAmount: totalPaid,
          status 
        }
      });

      return NextResponse.json({ 
        success: true, 
        tranche,
        totalPaid,
        status
      });
    } else {
      // Créer une nouvelle tranche ad-hoc
      const tranche = await prisma.enrollmentTranche.create({
        data: {
          enrollmentId,
          expectedAmount: amount,
          expectedPercent: (amount / enrollment.totalAmount) * 100,
          actualAmount: amount,
          hasExcuse: hasExcuse || false,
          excuseReason: hasExcuse ? excuseReason : null,
          method: method || 'CASH',
          reference,
          receivedBy,
          notes,
          paidAt: new Date()
        }
      });

      // Mettre à jour le total payé
      const newPaidAmount = enrollment.paidAmount + amount;
      const status = newPaidAmount >= enrollment.totalAmount 
        ? 'COMPLETED' 
        : newPaidAmount > 0 
          ? (hasExcuse ? 'EXCUSED' : 'PARTIAL')
          : 'PENDING';

      await prisma.studentEnrollment.update({
        where: { id: enrollmentId },
        data: { 
          paidAmount: newPaidAmount,
          status 
        }
      });

      return NextResponse.json({ 
        success: true, 
        tranche,
        totalPaid: newPaidAmount,
        status
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Approuver/refuser une excuse
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { trancheId, approved, notes } = await req.json();

    if (!trancheId || approved === undefined) {
      return NextResponse.json({ error: 'trancheId et approved requis' }, { status: 400 });
    }

    const tranche = await prisma.enrollmentTranche.update({
      where: { id: trancheId },
      data: {
        excuseApproved: approved,
        notes: notes || undefined
      }
    });

    return NextResponse.json({ success: true, tranche });
  } catch (error) {
    console.error('Error updating excuse:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

