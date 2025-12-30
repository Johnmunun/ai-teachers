import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TrainingPaymentsClient from './TrainingPaymentsClient';

async function getTrainingSessionPayments(trainingSessionId: string, teacherId: string) {
  const trainingSession = await prisma.trainingSession.findFirst({
    where: {
      id: trainingSessionId,
      teacherId
    },
    include: {
      enrollments: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          tranches: {
            orderBy: [
              { dueDate: 'asc' },
              { createdAt: 'asc' }
            ]
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        }
      }
    }
  });

  if (!trainingSession) {
    return null;
  }

  // Transformer les données pour l'affichage
  const allTranches = trainingSession.enrollments.flatMap(enrollment => 
    enrollment.tranches.map(tranche => ({
      id: tranche.id,
      enrollmentId: enrollment.id,
      student: {
        id: enrollment.student.id,
        name: enrollment.student.name,
        email: enrollment.student.email,
        phone: enrollment.student.phone
      },
      expectedAmount: tranche.expectedAmount,
      expectedPercent: tranche.expectedPercent,
      actualAmount: tranche.actualAmount || 0,
      dueDate: tranche.dueDate,
      paidAt: tranche.paidAt,
      method: tranche.method,
      reference: tranche.reference,
      hasExcuse: tranche.hasExcuse,
      excuseReason: tranche.excuseReason,
      excuseApproved: tranche.excuseApproved,
      notes: tranche.notes,
      createdAt: tranche.createdAt
    }))
  );

  // Calculer les statistiques
  const totalExpected = allTranches.reduce((sum, t) => sum + t.expectedAmount, 0);
  const totalPaid = allTranches.reduce((sum, t) => sum + (t.actualAmount || 0), 0);
  const paidTranches = allTranches.filter(t => t.paidAt).length;
  const pendingTranches = allTranches.filter(t => !t.paidAt).length;
  const overdueTranches = allTranches.filter(t => 
    !t.paidAt && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;
  const excusedTranches = allTranches.filter(t => t.hasExcuse).length;

  return {
    trainingSession: {
      id: trainingSession.id,
      title: trainingSession.title
    },
    tranches: allTranches,
    stats: {
      totalExpected,
      totalPaid,
      totalTranches: allTranches.length,
      paidTranches,
      pendingTranches,
      overdueTranches,
      excusedTranches,
      collectionRate: totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0
    }
  };
}

export default async function TrainingPaymentsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const role = (session.user as any).role || 'STUDENT';
  if (role !== 'TEACHER') {
    redirect('/dashboard');
  }

  const teacherId = (session.user as any).id;
  const data = await getTrainingSessionPayments(id, teacherId);

  if (!data) {
    notFound();
  }

  return (
    <div className="p-8">
      <Link 
        href={`/dashboard/training/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la formation
      </Link>

      <TrainingPaymentsClient
        trainingSession={data.trainingSession}
        tranches={data.tranches}
        stats={data.stats}
        trainingSessionId={id}
      />
    </div>
  );
}


