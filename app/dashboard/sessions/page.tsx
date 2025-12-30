import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Play,
  FileText,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  XCircle
} from 'lucide-react';

async function getTeacherSessions(teacherId: string) {
  const lessons = await prisma.lesson.findMany({
    where: {
      classroom: { teacherId }
    },
    include: {
      classroom: true,
      quizzes: {
        include: {
          responses: true
        }
      },
      sessionNotes: {
        where: { aiGenerated: true }
      }
    },
    orderBy: { startedAt: 'desc' }
  });

  return lessons;
}

export default async function TeacherSessionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const role = (session.user as any).role || 'STUDENT';
  if (role !== 'TEACHER') {
    redirect('/dashboard');
  }

  const userId = (session.user as any).id;
  const lessons = await getTeacherSessions(userId);

  // Stats
  const totalSessions = lessons.length;
  const totalQuizzes = lessons.reduce((sum, l) => sum + l.quizzes.length, 0);
  const totalResponses = lessons.reduce((sum, l) => 
    sum + l.quizzes.reduce((qs, q) => qs + q.responses.length, 0), 0
  );
  const avgDuration = lessons.filter(l => l.endedAt).length > 0
    ? Math.round(lessons.filter(l => l.endedAt).reduce((sum, l) => 
        sum + (new Date(l.endedAt!).getTime() - new Date(l.startedAt).getTime()) / 60000, 0
      ) / lessons.filter(l => l.endedAt).length)
    : 0;

  // Group by month
  const groupedLessons = lessons.reduce((groups: any, lesson) => {
    const date = new Date(lesson.startedAt);
    const monthYear = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(lesson);
    return groups;
  }, {});

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Historique des Sessions</h1>
        <p className="text-slate-400">Consultez toutes vos sessions passées</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4">
          <Calendar className="w-6 h-6 text-cyan-400 mb-2" />
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
          <p className="text-sm text-slate-400">Sessions données</p>
        </div>
        <div className="glass rounded-xl p-4">
          <FileText className="w-6 h-6 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-white">{totalQuizzes}</p>
          <p className="text-sm text-slate-400">Quiz créés</p>
        </div>
        <div className="glass rounded-xl p-4">
          <BarChart3 className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">{totalResponses}</p>
          <p className="text-sm text-slate-400">Réponses reçues</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Clock className="w-6 h-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">{avgDuration} min</p>
          <p className="text-sm text-slate-400">Durée moyenne</p>
        </div>
      </div>

      {/* Sessions Timeline */}
      {Object.keys(groupedLessons).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedLessons).map(([monthYear, monthLessons]: [string, any]) => (
            <div key={monthYear}>
              <h2 className="text-lg font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {monthYear}
              </h2>
              <div className="space-y-4">
                {monthLessons.map((lesson: any) => {
                  const duration = lesson.endedAt 
                    ? Math.round((new Date(lesson.endedAt).getTime() - new Date(lesson.startedAt).getTime()) / 60000)
                    : null;
                  const totalQuiz = lesson.quizzes.length;
                  const totalCorrect = lesson.quizzes.reduce((sum: number, q: any) => 
                    sum + q.responses.filter((r: any) => r.isCorrect).length, 0
                  );
                  const totalResp = lesson.quizzes.reduce((sum: number, q: any) => 
                    sum + q.responses.length, 0
                  );

                  return (
                    <div
                      key={lesson.id}
                      className="glass rounded-xl p-6 hover:border-cyan-500/30 border border-transparent transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {/* Date Badge */}
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {new Date(lesson.startedAt).getDate()}
                            </span>
                            <span className="text-xs text-slate-400 uppercase">
                              {new Date(lesson.startedAt).toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-white">
                                {lesson.title || `Session du ${new Date(lesson.startedAt).toLocaleDateString('fr-FR')}`}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs">
                                {lesson.classroom.title}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(lesson.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {duration && (
                                <span>Durée : {duration} min</span>
                              )}
                              {!lesson.endedAt && (
                                <span className="text-amber-400 flex items-center gap-1">
                                  <Play className="w-3 h-3" />
                                  En cours
                                </span>
                              )}
                            </p>

                            {/* Topics */}
                            {lesson.topics && lesson.topics.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {lesson.topics.slice(0, 4).map((topic: string, i: number) => (
                                  <span 
                                    key={i}
                                    className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Quiz Stats */}
                          {totalQuiz > 0 && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-white flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                {totalCorrect}/{totalResp}
                              </div>
                              <div className="text-xs text-slate-500">{totalQuiz} quiz</div>
                            </div>
                          )}

                          {/* Summary indicator */}
                          {lesson.sessionNotes.length > 0 && (
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center" title="Récapitulatif disponible">
                              <FileText className="w-5 h-5 text-emerald-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary Preview */}
                      {lesson.summary && (
                        <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/5">
                          <p className="text-sm text-slate-400 line-clamp-2">{lesson.summary}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucune session</h3>
          <p className="text-slate-400 mb-6">Vous n'avez pas encore donné de cours.</p>
          <Link
            href="/dashboard/classrooms"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            <BookOpen className="w-5 h-5" />
            Gérer mes cours
          </Link>
        </div>
      )}
    </div>
  );
}

