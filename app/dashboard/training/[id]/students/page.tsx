import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TrainingStudentsClient from './TrainingStudentsClient';

async function getTrainingSessionStudents(trainingSessionId: string, teacherId: string) {
  const trainingSession = await prisma.trainingSession.findFirst({
    where: {
      id: trainingSessionId,
      teacherId
    },
    include: {
      enrollments: {
        include: {
          student: {
            include: {
              quizResponses: {
                where: {
                  quiz: {
                    module: {
                      trainingSessionId: trainingSessionId
                    }
                  }
                }
              }
            }
          },
          tranches: {
            orderBy: { dueDate: 'asc' }
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
  const students = trainingSession.enrollments.map(enrollment => {
    const totalPaid = enrollment.tranches
      .filter(t => t.paidAt)
      .reduce((sum, t) => sum + (t.actualAmount || 0), 0);
    
    const totalDue = enrollment.tranches
      .reduce((sum, t) => sum + t.expectedAmount, 0);

    const quizCount = enrollment.student.quizResponses.length;
    const correctAnswers = enrollment.student.quizResponses.filter(q => q.isCorrect).length;

    return {
      id: enrollment.student.id,
      name: enrollment.student.name,
      email: enrollment.student.email,
      phone: enrollment.student.phone,
      enrolledAt: enrollment.enrolledAt,
      totalPaid,
      totalDue,
      quizCount,
      correctAnswers,
      tranches: enrollment.tranches
    };
  });

  return {
    trainingSession: {
      id: trainingSession.id,
      title: trainingSession.title
    },
    students
  };
}

export default async function TrainingStudentsPage({
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
  const data = await getTrainingSessionStudents(id, teacherId);

  if (!data) {
    notFound();
  }

  // Calculer les statistiques
  const totalStudents = data.students.length;
  const totalRevenue = data.students.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalExpected = data.students.reduce((sum, s) => sum + s.totalDue, 0);
  const pendingPayments = data.students.filter(s => s.totalPaid < s.totalDue).length;
  const avgScore = data.students.length > 0 
    ? Math.round(data.students.reduce((sum, s) => sum + (s.quizCount > 0 ? (s.correctAnswers / s.quizCount) * 100 : 0), 0) / data.students.length)
    : 0;

  return (
    <div className="p-8">
      <Link 
        href={`/dashboard/training/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la formation
      </Link>

      <TrainingStudentsClient
        trainingSession={data.trainingSession}
        students={data.students}
        stats={{
          totalStudents,
          totalRevenue,
          totalExpected,
          pendingPayments,
          avgScore
        }}
      />
    </div>
  );
}


