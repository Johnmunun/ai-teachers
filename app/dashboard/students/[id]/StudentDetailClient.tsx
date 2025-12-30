'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/currency';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CreditCard,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Download
} from 'lucide-react';

interface StudentDetailClientProps {
  student: any;
  stats: {
    totalPaid: number;
    totalDue: number;
    totalQuizzes: number;
    correctQuizzes: number;
    quizScore: number;
    grade: number;
    totalSessions: number;
  };
}

export default function StudentDetailClient({ student, stats }: StudentDetailClientProps) {
  const enrollments = student.studentClassrooms;
  const payments = student.payments;

  return (
    <div className="p-8">
      {/* Back Button */}
      <Link 
        href="/dashboard/students"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux étudiants
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white text-3xl font-bold">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {student.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Inscrit le {new Date(student.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {enrollments[0] && (
              <Link
                href={`/api/grades/bulletin?classroomId=${enrollments[0].classroom.id}&studentId=${student.id}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition"
              >
                <Download className="w-4 h-4" />
                Bulletin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.grade.toFixed(1)}/20</p>
          <p className="text-xs text-slate-400">Note moyenne</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <BookOpen className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{enrollments.length}</p>
          <p className="text-xs text-slate-400">Cours inscrits</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-violet-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
          <p className="text-xs text-slate-400">Sessions suivies</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.correctQuizzes}/{stats.totalQuizzes}</p>
          <p className="text-xs text-slate-400">Quiz réussis</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <CreditCard className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{formatMoney(stats.totalPaid)}</p>
          <p className="text-xs text-slate-400">sur {formatMoney(stats.totalDue)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Courses & Performance */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Cours & Performance
          </h2>

          {enrollments.map((enrollment: any) => {
            const classroomQuizzes = enrollment.classroom.lessons.flatMap((l: any) => l.quizzes);
            const correct = classroomQuizzes.filter((q: any) => q.responses.some((r: any) => r.isCorrect)).length;
            const total = classroomQuizzes.length;
            const score = total > 0 ? (correct / total) * 20 : 0;

            return (
              <div key={enrollment.id} className="glass rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white">{enrollment.classroom.title}</h3>
                    <p className="text-sm text-slate-500">
                      Inscrit le {new Date(enrollment.joinedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cyan-400">{score.toFixed(1)}/20</p>
                    <p className="text-xs text-slate-500">{correct}/{total} quiz</p>
                  </div>
                </div>

                {/* Recent sessions */}
                <div className="space-y-2">
                  {enrollment.classroom.lessons.slice(0, 3).map((lesson: any) => {
                    const lessonCorrect = lesson.quizzes.filter((q: any) => 
                      q.responses.some((r: any) => r.isCorrect)
                    ).length;
                    const lessonTotal = lesson.quizzes.length;

                    return (
                      <div 
                        key={lesson.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-500">
                            {new Date(lesson.startedAt).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </div>
                          <span className="text-sm text-white">
                            {lesson.title || 'Session'}
                          </span>
                        </div>
                        {lessonTotal > 0 && (
                          <div className="flex items-center gap-2">
                            {lesson.quizzes.map((q: any, i: number) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                  q.responses.some((r: any) => r.isCorrect)
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : q.responses.length > 0
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-slate-500/20 text-slate-400'
                                }`}
                              >
                                {q.responses.some((r: any) => r.isCorrect) ? '✓' : q.responses.length > 0 ? '✗' : '?'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payments */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Paiements
          </h2>

          {payments.length > 0 ? (
            payments.map((payment: any) => {
              const percent = (payment.paidAmount / payment.totalAmount) * 100;
              
              return (
                <div key={payment.id} className="glass rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{payment.classroom.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : payment.status === 'PARTIAL'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {payment.status === 'COMPLETED' ? 'Complet' : 
                         payment.status === 'PARTIAL' ? 'Partiel' : 'En attente'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {formatMoney(payment.paidAmount)}
                      </p>
                      <p className="text-sm text-slate-500">
                        sur {formatMoney(payment.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          payment.status === 'COMPLETED' 
                            ? 'bg-emerald-500' 
                            : 'bg-gradient-to-r from-cyan-500 to-violet-500'
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Tranches */}
                  {payment.tranches.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Tranches ({payment.tranches.length})
                      </p>
                      {payment.tranches.slice(0, 3).map((tranche: any, i: number) => (
                        <div 
                          key={tranche.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-slate-400">
                              {new Date(tranche.paidAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <span className="text-emerald-400 font-medium">
                            +{formatMoney(tranche.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="glass rounded-xl p-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              <p className="text-slate-400">Aucun paiement enregistré</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

