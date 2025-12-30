import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StudentDetailClient from './StudentDetailClient';

async function getStudentDetails(studentId: string, teacherId: string) {
  // Get student with their enrollments in teacher's classrooms
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      studentClassrooms: {
        where: {
          classroom: { teacherId }
        },
        include: {
          classroom: {
            include: {
              lessons: {
                include: {
                  quizzes: {
                    include: {
                      responses: {
                        where: { studentId }
                      }
                    }
                  }
                },
                orderBy: { startedAt: 'desc' }
              }
            }
          }
        }
      },
      payments: {
        where: {
          classroom: { teacherId }
        },
        include: {
          classroom: true,
          tranches: {
            orderBy: { paidAt: 'desc' }
          }
        }
      }
    }
  });

  return student;
}

export default async function StudentDetailPage({
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
  const student = await getStudentDetails(id, teacherId);

  if (!student) {
    notFound();
  }

  // Calculate stats
  const enrollments = student.studentClassrooms;
  const payments = student.payments;

  const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDue = payments.reduce((sum, p) => sum + p.totalAmount, 0);

  const allQuizzes = enrollments.flatMap(e => 
    e.classroom.lessons.flatMap(l => l.quizzes)
  );
  const totalQuizzes = allQuizzes.length;
  const answeredQuizzes = allQuizzes.filter(q => q.responses.length > 0);
  const correctQuizzesArray = allQuizzes.filter(q => q.responses.some(r => r.isCorrect));
  const correctQuizzes = correctQuizzesArray.length;
  const quizScore = totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0;
  const grade = (quizScore / 100) * 20;

  const totalSessions = enrollments.reduce((sum, e) => sum + e.classroom.lessons.length, 0);

  return (
    <StudentDetailClient
      student={student}
      stats={{
        totalPaid,
        totalDue,
        totalQuizzes,
        correctQuizzes,
        quizScore,
        grade,
        totalSessions
      }}
    />
  );
}

