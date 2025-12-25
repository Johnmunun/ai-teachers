import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PaymentsClient from './PaymentsClient';

async function getStudentPayments(studentId: string) {
  const payments = await prisma.payment.findMany({
    where: { studentId },
    include: {
      classroom: true,
      tranches: {
        orderBy: { paidAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return payments;
}

async function getTeacherPayments(teacherId: string) {
  const payments = await prisma.payment.findMany({
    where: { classroom: { teacherId } },
    include: {
      student: true,
      classroom: true,
      tranches: {
        orderBy: { paidAt: 'desc' }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const stats = {
    totalReceived: payments.reduce((sum, p) => sum + p.paidAmount, 0),
    totalExpected: payments.reduce((sum, p) => sum + p.totalAmount, 0),
    completedPayments: payments.filter(p => p.status === 'COMPLETED').length,
    pendingPayments: payments.filter(p => p.status !== 'COMPLETED').length
  };

  return { payments, stats };
}

export default async function PaymentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role || 'STUDENT';
  const isTeacher = role === 'TEACHER';

  if (isTeacher) {
    const { payments, stats } = await getTeacherPayments(userId);
    return <PaymentsClient payments={payments} stats={stats} isTeacher={true} />;
  } else {
    const payments = await getStudentPayments(userId);
    return <PaymentsClient payments={payments} isTeacher={false} />;
  }
}
