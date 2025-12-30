import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST - Créer un nouveau paiement lors de l'inscription à un cours
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { studentId, classroomId, totalAmount, dueDate, notes } = await req.json();

    if (!studentId || !classroomId) {
      return NextResponse.json({ error: 'studentId et classroomId requis' }, { status: 400 });
    }

    // Vérifier si un paiement existe déjà
    const existingPayment = await prisma.payment.findUnique({
      where: {
        studentId_classroomId: { studentId, classroomId }
      }
    });

    if (existingPayment) {
      return NextResponse.json({ 
        error: 'Un paiement existe déjà pour cet étudiant et ce cours' 
      }, { status: 400 });
    }

    // Récupérer le prix du cours si totalAmount non fourni
    let amount = totalAmount;
    if (!amount) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId }
      });
      amount = classroom?.price || 0;
    }

    // Créer le paiement
    const payment = await prisma.payment.create({
      data: {
        studentId,
        classroomId,
        totalAmount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes
      },
      include: {
        student: { select: { name: true, email: true } },
        classroom: { select: { title: true } }
      }
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

