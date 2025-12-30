'use client';

import { formatMoney } from '@/lib/currency';
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  BookOpen,
  MoreVertical,
  UserPlus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface StudentsClientProps {
  students: any[];
  classrooms: any[];
  stats: {
    totalStudents: number;
    totalRevenue: number;
    pendingPayments: number;
    avgScore: number;
  };
}

export default function StudentsClient({ students, classrooms, stats }: StudentsClientProps) {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-400" />
            Mes Étudiants
          </h1>
          <p className="text-slate-400">Gérez vos étudiants et suivez leur progression</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
            <UserPlus className="w-4 h-4" />
            Inviter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-slate-400 text-sm">Total étudiants</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-slate-400 text-sm">Revenus totaux</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatMoney(stats.totalRevenue)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-slate-400 text-sm">Paiements en attente</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{stats.pendingPayments}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-slate-400 text-sm">Score moyen</span>
          </div>
          <p className="text-3xl font-bold text-violet-400">{stats.avgScore}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <select className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50">
            <option value="">Tous les cours</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.studentCount})</option>
            ))}
          </select>
          <select className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50">
            <option value="">Tous les statuts</option>
            <option value="paid">Paiement complet</option>
            <option value="partial">Paiement partiel</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      {students.length > 0 ? (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Cours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Inscrit le
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((student: any) => {
                  const paymentPercent = student.totalDue > 0 ? (student.totalPaid / student.totalDue) * 100 : 0;
                  const quizPercent = student.quizCount > 0 ? (student.correctAnswers / student.quizCount) * 100 : 0;
                  const paymentStatus = paymentPercent >= 100 ? 'complete' : paymentPercent > 0 ? 'partial' : 'pending';
                  
                  return (
                    <tr key={student.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-medium">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{student.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.classrooms?.slice(0, 2).map((c: any) => (
                            <span 
                              key={c.id}
                              className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs"
                            >
                              {c.title}
                            </span>
                          ))}
                          {student.trainingSessions?.slice(0, 2 - (student.classrooms?.length || 0)).map((s: any) => (
                            <span 
                              key={s.id}
                              className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs"
                            >
                              {s.title}
                            </span>
                          ))}
                          {((student.classrooms?.length || 0) + (student.trainingSessions?.length || 0)) > 2 && (
                            <span className="px-2 py-1 rounded-lg bg-white/10 text-slate-400 text-xs">
                              +{((student.classrooms?.length || 0) + (student.trainingSessions?.length || 0)) - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              paymentStatus === 'complete' ? 'bg-emerald-400' :
                              paymentStatus === 'partial' ? 'bg-amber-400' : 'bg-red-400'
                            }`} />
                            <span className="text-white text-sm">
                              {formatMoney(student.totalPaid)}
                            </span>
                            <span className="text-slate-500 text-sm">
                              / {formatMoney(student.totalDue)}
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                paymentStatus === 'complete' ? 'bg-emerald-500' :
                                paymentStatus === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(paymentPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.quizCount > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                              quizPercent >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                              quizPercent >= 50 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {Math.round(quizPercent)}%
                            </div>
                            <div className="text-xs text-slate-500">
                              {student.correctAnswers}/{student.quizCount} quiz
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">Aucun quiz</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300 text-sm">
                          {(student.classrooms?.[0] || student.trainingSessions?.[0]) && new Date(
                            (student.classrooms?.[0]?.joinedAt || student.trainingSessions?.[0]?.joinedAt) as string
                          ).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition"
                          >
                            Voir
                          </Link>
                          <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Aucun étudiant</h3>
          <p className="text-slate-400 mb-6">
            Vous n'avez pas encore d'étudiants inscrits à vos cours.
          </p>
          <Link
            href="/dashboard/classrooms"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            <BookOpen className="w-5 h-5" />
            Gérer mes cours
          </Link>
        </div>
      )}
    </div>
  );
}

