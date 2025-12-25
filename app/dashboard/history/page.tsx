import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  BookOpen,
  Brain,
  ArrowRight,
  Play,
  FileText
} from 'lucide-react';

async function getStudentLessons(studentId: string) {
  const lessons = await prisma.lesson.findMany({
    where: {
      classroom: {
        studentClassrooms: { some: { studentId } }
      }
    },
    include: {
      classroom: true,
      sessionNotes: {
        where: { 
          OR: [
            { studentId: null }, // General notes
            { studentId }
          ]
        }
      },
      quizzes: {
        include: {
          responses: {
            where: { studentId }
          }
        }
      }
    },
    orderBy: { startedAt: 'desc' }
  });

  return lessons;
}

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const lessons = await getStudentLessons(userId);

  // Group lessons by month
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
        <h1 className="text-3xl font-bold text-white mb-2">Historique des Séances</h1>
        <p className="text-slate-400">Retrouvez tout ce qui a été couvert dans vos cours</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4">
          <Calendar className="w-6 h-6 text-cyan-400 mb-2" />
          <p className="text-2xl font-bold text-white">{lessons.length}</p>
          <p className="text-sm text-slate-400">Séances suivies</p>
        </div>
        <div className="glass rounded-xl p-4">
          <BookOpen className="w-6 h-6 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {lessons.reduce((sum, l) => sum + (l.topics?.length || 0), 0)}
          </p>
          <p className="text-sm text-slate-400">Sujets couverts</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Brain className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {lessons.reduce((sum, l) => sum + l.quizzes.length, 0)}
          </p>
          <p className="text-sm text-slate-400">Quiz passés</p>
        </div>
        <div className="glass rounded-xl p-4">
          <FileText className="w-6 h-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {lessons.reduce((sum, l) => sum + l.sessionNotes.length, 0)}
          </p>
          <p className="text-sm text-slate-400">Notes disponibles</p>
        </div>
      </div>

      {/* Lessons Timeline */}
      {Object.keys(groupedLessons).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedLessons).map(([monthYear, monthLessons]: [string, any]) => (
            <div key={monthYear}>
              <h2 className="text-lg font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {monthYear}
              </h2>
              <div className="space-y-4">
                {monthLessons.map((lesson: any) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucune séance</h3>
          <p className="text-slate-400 mb-6">Vous n'avez pas encore suivi de cours.</p>
          <Link 
            href="/dashboard/courses"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            Voir les cours disponibles
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function LessonCard({ lesson }: { lesson: any }) {
  const date = new Date(lesson.startedAt);
  const quizzesPassed = lesson.quizzes.filter((q: any) => q.responses.length > 0).length;
  const correctAnswers = lesson.quizzes.reduce((sum: number, q: any) => 
    sum + q.responses.filter((r: any) => r.isCorrect).length, 0
  );
  const totalQuizzes = lesson.quizzes.length;

  return (
    <Link
      href={`/dashboard/history/${lesson.id}`}
      className="block glass rounded-xl p-6 hover:border-cyan-500/30 border border-transparent transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Date Badge */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">{date.getDate()}</span>
            <span className="text-xs text-slate-400 uppercase">
              {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition mb-1">
              {lesson.title || lesson.classroom.title}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" />
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {lesson.endedAt && (
                <span>
                  • Durée : {Math.round((new Date(lesson.endedAt).getTime() - date.getTime()) / 60000)} min
                </span>
              )}
            </p>

            {/* Topics */}
            {lesson.topics && lesson.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {lesson.topics.slice(0, 4).map((topic: string, i: number) => (
                  <span 
                    key={i}
                    className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400"
                  >
                    {topic}
                  </span>
                ))}
                {lesson.topics.length > 4 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-400">
                    +{lesson.topics.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quiz Stats */}
          {totalQuizzes > 0 && (
            <div className="text-right">
              <div className="text-sm text-slate-400">Quiz</div>
              <div className="text-white font-medium">
                {correctAnswers}/{quizzesPassed} ✓
              </div>
            </div>
          )}

          {/* Notes indicator */}
          {lesson.sessionNotes.length > 0 && (
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
          )}

          <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Summary preview */}
      {lesson.summary && (
        <p className="mt-4 text-sm text-slate-400 line-clamp-2 border-t border-white/5 pt-4">
          {lesson.summary}
        </p>
      )}
    </Link>
  );
}


