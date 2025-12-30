import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Trophy,
  Target,
  TrendingUp,
  User,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface StudentGrade {
  student: {
    id: string;
    name: string;
    email: string;
  };
  quizStats: {
    total: number;
    answered: number;
    correct: number;
    percentage: number;
  };
  sessions: {
    lessonId: string;
    lessonTitle: string;
    date: Date;
    quizzes: {
      question: string;
      isCorrect: boolean;
    }[];
  }[];
  overallGrade: number;
}

async function getClassroomGrades(classroomId: string, teacherId: string): Promise<{
  classroom: any;
  grades: StudentGrade[];
}> {
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId },
    include: {
      studentClassrooms: {
        include: { student: true }
      },
      lessons: {
        include: {
          quizzes: {
            include: {
              responses: true
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      }
    }
  });

  if (!classroom) {
    return { classroom: null, grades: [] };
  }

  const grades: StudentGrade[] = classroom.studentClassrooms.map(({ student }) => {
    const sessions = classroom.lessons.map(lesson => {
      const quizResults = lesson.quizzes.map(quiz => {
        const response = quiz.responses.find(r => r.studentId === student.id);
        return {
          question: quiz.question,
          isCorrect: response?.isCorrect || false
        };
      });

      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title || `Session du ${new Date(lesson.startedAt).toLocaleDateString('fr-FR')}`,
        date: lesson.startedAt,
        quizzes: quizResults
      };
    });

    const totalQuizzes = sessions.reduce((sum, s) => sum + s.quizzes.length, 0);
    const answeredQuizzes = sessions.reduce((sum, s) => 
      sum + s.quizzes.filter(q => q.isCorrect !== undefined).length, 0);
    const correctQuizzes = sessions.reduce((sum, s) => 
      sum + s.quizzes.filter(q => q.isCorrect).length, 0);
    
    const percentage = totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0;
    const overallGrade = percentage >= 90 ? 20 :
                         percentage >= 80 ? 18 :
                         percentage >= 70 ? 16 :
                         percentage >= 60 ? 14 :
                         percentage >= 50 ? 12 :
                         percentage >= 40 ? 10 :
                         percentage >= 30 ? 8 :
                         percentage >= 20 ? 6 : 4;

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email
      },
      quizStats: {
        total: totalQuizzes,
        answered: answeredQuizzes,
        correct: correctQuizzes,
        percentage
      },
      sessions,
      overallGrade
    };
  });

  return { classroom, grades };
}

export default async function GradesPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  if ((session.user as any).role !== 'TEACHER') {
    redirect('/dashboard');
  }

  const userId = (session.user as any).id;
  const { classroom, grades } = await getClassroomGrades(id, userId);

  if (!classroom) {
    notFound();
  }

  // Calculate class average
  const classAverage = grades.length > 0
    ? grades.reduce((sum, g) => sum + g.overallGrade, 0) / grades.length
    : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/dashboard/classrooms/${id}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au cours
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notes et Évaluations</h1>
            <p className="text-slate-400">{classroom.title}</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4">
          <Trophy className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{classAverage.toFixed(1)}/20</p>
          <p className="text-sm text-slate-400">Moyenne de classe</p>
        </div>
        <div className="glass rounded-xl p-4">
          <User className="w-6 h-6 text-cyan-400 mb-2" />
          <p className="text-2xl font-bold text-white">{grades.length}</p>
          <p className="text-sm text-slate-400">Étudiants</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Calendar className="w-6 h-6 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-white">{classroom.lessons.length}</p>
          <p className="text-sm text-slate-400">Sessions</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Target className="w-6 h-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {classroom.lessons.reduce((sum: number, l: any) => sum + l.quizzes.length, 0)}
          </p>
          <p className="text-sm text-slate-400">Quiz donnés</p>
        </div>
      </div>

      {/* Grades Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Tableau des notes
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Étudiant</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Quiz Réussis</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Taux de Réussite</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Note /20</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Mention</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {grades.map((grade) => {
                const mention = grade.overallGrade >= 16 ? 'Très Bien' :
                               grade.overallGrade >= 14 ? 'Bien' :
                               grade.overallGrade >= 12 ? 'Assez Bien' :
                               grade.overallGrade >= 10 ? 'Passable' : 'Insuffisant';
                
                const mentionColor = grade.overallGrade >= 16 ? 'text-emerald-400 bg-emerald-500/20' :
                                    grade.overallGrade >= 14 ? 'text-cyan-400 bg-cyan-500/20' :
                                    grade.overallGrade >= 12 ? 'text-blue-400 bg-blue-500/20' :
                                    grade.overallGrade >= 10 ? 'text-amber-400 bg-amber-500/20' : 
                                    'text-red-400 bg-red-500/20';

                return (
                  <tr key={grade.student.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-medium">
                          {grade.student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{grade.student.name}</div>
                          <div className="text-sm text-slate-500">{grade.student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-white">{grade.quizStats.correct}</span>
                      <span className="text-slate-500">/{grade.quizStats.total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              grade.quizStats.percentage >= 50 
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                                : 'bg-gradient-to-r from-amber-500 to-red-500'
                            }`}
                            style={{ width: `${grade.quizStats.percentage}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">{grade.quizStats.percentage.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-2xl font-bold text-white">{grade.overallGrade}</span>
                      <span className="text-slate-500">/20</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${mentionColor}`}>
                        {mention}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/api/grades/bulletin?classroomId=${id}&studentId=${grade.student.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Bulletin
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {grades.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            Aucun étudiant inscrit ou aucune note disponible.
          </div>
        )}
      </div>
    </div>
  );
}


