import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Récupérer les paiements
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const classroomId = searchParams.get('classroomId');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (classroomId) where.classroomId = classroomId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        classroom: { select: { id: true, title: true } },
        tranches: { orderBy: { paidAt: 'desc' } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Ajouter une tranche de paiement
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { paymentId, amount, method, reference, receivedBy, notes } = await req.json();

    if (!paymentId || !amount) {
      return NextResponse.json({ error: 'paymentId et amount requis' }, { status: 400 });
    }

    // Vérifier que le paiement existe et appartient à un cours de l'enseignant
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        classroom: { teacherId: (session.user as any).id }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
    }

    // Créer la tranche
    const tranche = await prisma.paymentTranche.create({
      data: {
        paymentId,
        studentId: payment.studentId,
        amount: parseFloat(amount),
        method: method || 'CASH',
        reference,
        receivedBy,
        notes
      }
    });

    // Mettre à jour le montant payé
    const newPaidAmount = payment.paidAmount + parseFloat(amount);
    const newStatus = newPaidAmount >= payment.totalAmount 
      ? 'COMPLETED' 
      : newPaidAmount > 0 
        ? 'PARTIAL' 
        : 'PENDING';

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus
      }
    });

    return NextResponse.json({ 
      success: true, 
      tranche,
      newPaidAmount,
      status: newStatus
    });
  } catch (error) {
    console.error('Error adding payment tranche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

