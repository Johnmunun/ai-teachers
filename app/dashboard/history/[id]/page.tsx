import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  Brain,
  Code2,
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageSquare,
  Play
} from 'lucide-react';

async function getLesson(lessonId: string, studentId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      classroom: true,
      sessionNotes: {
        where: {
          OR: [
            { studentId: null },
            { studentId }
          ]
        },
        orderBy: { createdAt: 'asc' }
      },
      quizzes: {
        include: {
          responses: {
            where: { studentId }
          }
        }
      },
      comprehensionLogs: {
        where: { studentId }
      }
    }
  });

  return lesson;
}

export default async function LessonDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const lesson = await getLesson(id, userId);

  if (!lesson) {
    notFound();
  }

  const date = new Date(lesson.startedAt);
  const duration = lesson.endedAt 
    ? Math.round((new Date(lesson.endedAt).getTime() - date.getTime()) / 60000)
    : null;

  const quizStats = {
    total: lesson.quizzes.length,
    answered: lesson.quizzes.filter(q => q.responses.length > 0).length,
    correct: lesson.quizzes.reduce((sum, q) => 
      sum + q.responses.filter(r => r.isCorrect).length, 0
    )
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <Link 
        href="/dashboard/history"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l'historique
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <span className="text-sm text-cyan-400 font-medium mb-2 block">
              {lesson.classroom.title}
            </span>
            <h1 className="text-3xl font-bold text-white mb-4">
              {lesson.title || `Séance du ${date.toLocaleDateString('fr-FR')}`}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {date.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {duration && (
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  {duration} minutes
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Link
            href={`/dashboard/revisions?lessonId=${lesson.id}`}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-500/20 to-rose-500/20 border border-violet-500/30 hover:border-violet-500/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-medium text-white group-hover:text-violet-400 transition">
                Réviser avec Nathalie
              </div>
              <div className="text-sm text-slate-500">
                L'IA vous aide à revoir cette séance
              </div>
            </div>
          </Link>
        </div>

        {/* Topics */}
        {lesson.topics && lesson.topics.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Sujets abordés
            </h3>
            <div className="flex flex-wrap gap-2">
              {lesson.topics.map((topic, i) => (
                <span 
                  key={i}
                  className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary */}
          {lesson.summary && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Résumé de la séance
              </h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {lesson.summary}
              </p>
            </div>
          )}

          {/* Session Notes */}
          {lesson.sessionNotes.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-violet-400" />
                Notes & Code
              </h2>
              <div className="space-y-6">
                {lesson.sessionNotes.map((note) => (
                  <div key={note.id} className="border-l-2 border-violet-500/50 pl-4">
                    {note.aiGenerated && (
                      <span className="inline-flex items-center gap-1 text-xs text-violet-400 mb-2">
                        <Sparkles className="w-3 h-3" />
                        Généré par l'IA
                      </span>
                    )}
                    <div className="text-slate-300 whitespace-pre-wrap">
                      {note.content}
                    </div>
                    {note.codeSnippets && (
                      <div className="mt-4 code-block p-4 text-sm">
                        <pre className="text-slate-300 overflow-x-auto">
                          {typeof note.codeSnippets === 'string' 
                            ? note.codeSnippets 
                            : JSON.stringify(note.codeSnippets, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No content fallback */}
          {!lesson.summary && lesson.sessionNotes.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Pas de notes pour cette séance
              </h3>
              <p className="text-slate-400 mb-6">
                Les notes seront disponibles après que le professeur les aura ajoutées.
              </p>
              <Link
                href={`/dashboard/revisions?lessonId=${lesson.id}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium"
              >
                <Sparkles className="w-5 h-5" />
                Réviser avec l'IA
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quiz Results */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-400" />
              Quiz de la séance
            </h3>
            
            {quizStats.total > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-white">{quizStats.total}</div>
                    <div className="text-xs text-slate-500">Total</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-cyan-400">{quizStats.answered}</div>
                    <div className="text-xs text-slate-500">Répondu</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-emerald-400">{quizStats.correct}</div>
                    <div className="text-xs text-slate-500">Correct</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {lesson.quizzes.map((quiz, i) => {
                    const response = quiz.responses[0];
                    return (
                      <div 
                        key={quiz.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white mb-1">
                              Q{i + 1}: {quiz.question.slice(0, 50)}...
                            </div>
                            {response ? (
                              <div className={`text-sm flex items-center gap-1 ${
                                response.isCorrect ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {response.isCorrect ? (
                                  <><CheckCircle2 className="w-4 h-4" /> Correct</>
                                ) : (
                                  <><XCircle className="w-4 h-4" /> Incorrect</>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500">Non répondu</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-sm">
                Aucun quiz n'a été donné pendant cette séance.
              </p>
            )}
          </div>

          {/* Comprehension Score */}
          {lesson.comprehensionLogs.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Score de compréhension
              </h3>
              {lesson.comprehensionLogs.map((log) => (
                <div key={log.id} className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                    {log.score}/10
                  </div>
                  {log.feedback && (
                    <p className="text-sm text-slate-400">{log.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


