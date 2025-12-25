import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

async function getTeacherStats(teacherId: string) {
  const [classrooms, students, payments] = await Promise.all([
    prisma.classroom.count({ where: { teacherId } }),
    prisma.studentClassroom.count({
      where: { classroom: { teacherId } }
    }),
    prisma.payment.aggregate({
      where: { classroom: { teacherId } },
      _sum: { paidAmount: true, totalAmount: true }
    })
  ]);

  return {
    classrooms,
    students,
    paidAmount: payments._sum.paidAmount || 0,
    totalAmount: payments._sum.totalAmount || 0
  };
}

async function getStudentStats(studentId: string) {
  const [courses, payments, lessons] = await Promise.all([
    prisma.studentClassroom.count({ where: { studentId } }),
    prisma.payment.findMany({
      where: { studentId },
      include: { classroom: true }
    }),
    prisma.lesson.count({
      where: {
        classroom: {
          studentClassrooms: { some: { studentId } }
        }
      }
    })
  ]);

  const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDue = payments.reduce((sum, p) => sum + p.totalAmount, 0);

  return {
    courses,
    payments,
    lessons,
    totalPaid,
    totalDue,
    remainingAmount: totalDue - totalPaid
  };
}

async function getRecentLessons(userId: string, role: string) {
  if (role === 'TEACHER') {
    return prisma.lesson.findMany({
      where: { classroom: { teacherId: userId } },
      include: { classroom: true },
      orderBy: { startedAt: 'desc' },
      take: 5
    });
  } else {
    return prisma.lesson.findMany({
      where: {
        classroom: {
          studentClassrooms: { some: { studentId: userId } }
        }
      },
      include: { classroom: true },
      orderBy: { startedAt: 'desc' },
      take: 5
    });
  }
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role || 'STUDENT';
  const isTeacher = role === 'TEACHER';

  const stats = isTeacher 
    ? await getTeacherStats(userId)
    : await getStudentStats(userId);

  const recentLessons = await getRecentLessons(userId, role);

  return (
    <DashboardClient
      userName={session.user.name?.split(' ')[0] || ''}
      isTeacher={isTeacher}
      stats={stats}
      recentLessons={recentLessons}
    />
  );
}
