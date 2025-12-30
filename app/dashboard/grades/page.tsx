import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Trophy,
  FileText,
  Download,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Star
} from 'lucide-react';

async function getStudentGrades(studentId: string) {
  const enrollments = await prisma.studentClassroom.findMany({
    where: { studentId },
    include: {
      classroom: {
        include: {
          teacher: true,
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
  });

  return enrollments.map(enrollment => {
    const classroom = enrollment.classroom;
    const allQuizzes = classroom.lessons.flatMap(l => l.quizzes);
    const totalQuizzes = allQuizzes.length;
    const answeredQuizzes = allQuizzes.filter(q => q.responses.length > 0);
    const correctQuizzes = allQuizzes.filter(q => q.responses.some(r => r.isCorrect));

    const percentage = totalQuizzes > 0 ? (correctQuizzes.length / totalQuizzes) * 100 : 0;
    const grade = (percentage / 100) * 20;

    return {
      classroom: {
        id: classroom.id,
        title: classroom.title,
        teacher: classroom.teacher.name
      },
      stats: {
        sessions: classroom.lessons.length,
        totalQuizzes,
        answered: answeredQuizzes.length,
        correct: correctQuizzes.length,
        percentage,
        grade
      },
      lessons: classroom.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        date: lesson.startedAt,
        quizzes: lesson.quizzes.map(q => ({
          question: q.question,
          answered: q.responses.length > 0,
          correct: q.responses.some(r => r.isCorrect)
        }))
      }))
    };
  });
}

export default async function StudentGradesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const grades = await getStudentGrades(userId);

  // Overall stats
  const totalQuizzes = grades.reduce((sum, g) => sum + g.stats.totalQuizzes, 0);
  const totalCorrect = grades.reduce((sum, g) => sum + g.stats.correct, 0);
  const overallPercentage = totalQuizzes > 0 ? (totalCorrect / totalQuizzes) * 100 : 0;
  const overallGrade = (overallPercentage / 100) * 20;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mes Notes</h1>
        <p className="text-slate-400">Consultez vos résultats et téléchargez vos bulletins</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-6 text-center">
          <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{overallGrade.toFixed(1)}</p>
          <p className="text-sm text-slate-400">Moyenne générale /20</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <Target className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{overallPercentage.toFixed(0)}%</p>
          <p className="text-sm text-slate-400">Taux de réussite</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{totalCorrect}/{totalQuizzes}</p>
          <p className="text-sm text-slate-400">Quiz réussis</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <BookOpen className="w-8 h-8 text-violet-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-white">{grades.length}</p>
          <p className="text-sm text-slate-400">Cours suivis</p>
        </div>
      </div>

      {/* Grades by Course */}
      <div className="space-y-6">
        {grades.length > 0 ? (
          grades.map((courseGrade) => {
            const mention = courseGrade.stats.grade >= 16 ? 'Très Bien' :
                           courseGrade.stats.grade >= 14 ? 'Bien' :
                           courseGrade.stats.grade >= 12 ? 'Assez Bien' :
                           courseGrade.stats.grade >= 10 ? 'Passable' : 'Insuffisant';

            const mentionColor = courseGrade.stats.grade >= 16 ? 'bg-emerald-500/20 text-emerald-400' :
                                courseGrade.stats.grade >= 14 ? 'bg-cyan-500/20 text-cyan-400' :
                                courseGrade.stats.grade >= 12 ? 'bg-blue-500/20 text-blue-400' :
                                courseGrade.stats.grade >= 10 ? 'bg-amber-500/20 text-amber-400' : 
                                'bg-red-500/20 text-red-400';

            return (
              <div key={courseGrade.classroom.id} className="glass rounded-2xl overflow-hidden">
                {/* Course Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-cyan-500/5 to-violet-500/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white">{courseGrade.classroom.title}</h2>
                        <p className="text-slate-400 text-sm">Enseignant : {courseGrade.classroom.teacher}</p>
                      </div>
                    </div>
                    <Link
                      href={`/api/grades/bulletin?classroomId=${courseGrade.classroom.id}&studentId=${userId}`}
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition"
                    >
                      <Download className="w-4 h-4" />
                      Bulletin
                    </Link>
                  </div>
                </div>

                {/* Grade Summary */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-white/5">
                  <div className="col-span-2 md:col-span-1 text-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
                    <p className="text-3xl font-bold text-cyan-400">{courseGrade.stats.grade.toFixed(1)}</p>
                    <p className="text-xs text-slate-400">Note /20</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${mentionColor}`}>
                      {mention}
                    </span>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-2xl font-bold text-white">{courseGrade.stats.sessions}</p>
                    <p className="text-xs text-slate-400">Sessions</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-2xl font-bold text-white">{courseGrade.stats.totalQuizzes}</p>
                    <p className="text-xs text-slate-400">Quiz total</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-2xl font-bold text-emerald-400">{courseGrade.stats.correct}</p>
                    <p className="text-xs text-slate-400">Réussis</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <p className="text-2xl font-bold text-white">{courseGrade.stats.percentage.toFixed(0)}%</p>
                    <p className="text-xs text-slate-400">Réussite</p>
                  </div>
                </div>

                {/* Sessions Detail */}
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Détail par session
                  </h3>
                  <div className="space-y-3">
                    {courseGrade.lessons.slice(0, 5).map(lesson => {
                      const lessonCorrect = lesson.quizzes.filter(q => q.correct).length;
                      const lessonTotal = lesson.quizzes.length;
                      const lessonScore = lessonTotal > 0 ? (lessonCorrect / lessonTotal) * 20 : 0;

                      return (
                        <div key={lesson.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[50px]">
                              <Calendar className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                              <p className="text-xs text-slate-400">
                                {new Date(lesson.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {lesson.title || `Session du ${new Date(lesson.date).toLocaleDateString('fr-FR')}`}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                {lesson.quizzes.map((quiz, i) => (
                                  <span 
                                    key={i}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                      quiz.correct 
                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                        : quiz.answered
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-slate-500/20 text-slate-400'
                                    }`}
                                  >
                                    {quiz.correct ? '✓' : quiz.answered ? '✗' : '?'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">{lessonScore.toFixed(1)}/20</p>
                            <p className="text-xs text-slate-500">{lessonCorrect}/{lessonTotal} quiz</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass rounded-2xl p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune note disponible</h3>
            <p className="text-slate-400">
              Inscrivez-vous à des cours et participez aux quiz pour voir vos notes ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


