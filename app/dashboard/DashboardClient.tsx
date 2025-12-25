'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatMoney, getCurrency } from '@/lib/currency';

interface DashboardClientProps {
  userName: string;
  isTeacher: boolean;
  stats: any;
  recentLessons: any[];
}

export default function DashboardClient({ userName, isTeacher, stats, recentLessons }: DashboardClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [currency, setCurrency] = useState(() => getCurrency());

  // Force re-render when currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      // Update currency state to force re-render
      setCurrency(getCurrency());
      setRefreshKey(prev => prev + 1);
    };

    // Listen for custom event from settings page
    window.addEventListener('currencyChanged', handleCurrencyChange);
    // Also listen for storage changes (in case settings are changed in another tab)
    window.addEventListener('storage', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
      window.removeEventListener('storage', handleCurrencyChange);
    };
  }, []);

  return (
    <div key={refreshKey} className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Bonjour, {userName} 👋
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {isTeacher 
            ? 'Gérez vos cours et suivez vos étudiants'
            : 'Suivez votre progression et vos paiements'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {isTeacher ? (
          <>
            <StatCard
              icon={BookOpen}
              label="Classes actives"
              value={stats.classrooms}
              color="cyan"
            />
            <StatCard
              icon={Users}
              label="Étudiants"
              value={stats.students}
              color="violet"
            />
            <StatCard
              icon={CreditCard}
              label="Reçu"
              value={formatMoney(stats.paidAmount)}
              color="emerald"
            />
            <StatCard
              icon={TrendingUp}
              label="À recevoir"
              value={formatMoney(stats.totalAmount - stats.paidAmount)}
              color="amber"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={BookOpen}
              label="Mes cours"
              value={stats.courses}
              color="cyan"
            />
            <StatCard
              icon={Calendar}
              label="Séances suivies"
              value={stats.lessons}
              color="violet"
            />
            <StatCard
              key={`paid-${refreshKey}`}
              icon={CheckCircle2}
              label="Payé"
              value={formatMoney(stats.totalPaid)}
              color="emerald"
            />
            <StatCard
              key={`remaining-${refreshKey}`}
              icon={AlertCircle}
              label="Reste à payer"
              value={formatMoney(stats.remainingAmount)}
              color="rose"
              highlight={stats.remainingAmount > 0}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Recent Sessions */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Séances récentes
              </h2>
              <Link 
                href={isTeacher ? "/dashboard/sessions" : "/dashboard/history"}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Voir tout <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {recentLessons.length > 0 ? (
              <div className="space-y-4">
                {recentLessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/history/${lesson.id}`}
                    className="block p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white group-hover:text-cyan-400 transition">
                          {lesson.title || lesson.classroom.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {new Date(lesson.startedAt).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.topics && lesson.topics.length > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400">
                            {lesson.topics.length} sujets
                          </span>
                        )}
                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune séance pour le moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {isTeacher ? (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
              <div className="space-y-3">
                <Link
                  href="/classroom/new"
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Play className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Démarrer un cours</div>
                    <div className="text-sm text-slate-500">Lancer une nouvelle session</div>
                  </div>
                </Link>
                <Link
                  href="/dashboard/students"
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Gérer les étudiants</div>
                    <div className="text-sm text-slate-500">Paiements et inscriptions</div>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Révision IA</h2>
              <Link
                href="/dashboard/revisions"
                className="block p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-rose-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Nathalie vous attend</div>
                    <div className="text-sm text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      En ligne
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  Révisez les concepts du dernier cours avec l'aide de notre IA pédagogique.
                </p>
              </Link>
            </div>
          )}

          {/* Payment Status (Students only) */}
          {!isTeacher && stats.payments?.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Mes paiements</h2>
                <Link 
                  href="/dashboard/payments"
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Détails
                </Link>
              </div>
              <div className="space-y-4">
                {stats.payments.slice(0, 2).map((payment: any) => (
                  <div key={payment.id} className="p-4 rounded-xl bg-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-white">{payment.classroom.title}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === 'COMPLETED' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : payment.status === 'PARTIAL'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {payment.status === 'COMPLETED' ? 'Payé' : 
                         payment.status === 'PARTIAL' ? 'En cours' : 'En attente'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Payé</span>
                      <span className="text-white">{formatMoney(payment.paidAmount)} / {formatMoney(payment.totalAmount)}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all"
                        style={{ width: `${(payment.paidAmount / payment.totalAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  highlight = false
}: { 
  icon: any; 
  label: string; 
  value: string | number;
  color: string;
  highlight?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20',
  };

  const iconClasses: Record<string, string> = {
    cyan: 'text-cyan-400',
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border p-6 ${highlight ? 'ring-2 ring-rose-500/50' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 ${iconClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

