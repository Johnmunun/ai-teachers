'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Play,
  Settings,
  Sparkles,
  ChevronRight,
  Target,
  TrendingUp,
  Info
} from 'lucide-react';
import { formatMoney } from '@/lib/currency';

interface TrainingSession {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  totalPrice: number;
  currency: string;
  isActive: boolean;
  modules: {
    id: string;
    title: string;
    orderIndex: number;
    courses: { id: string; title: string }[];
  }[];
  schedules: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  _count: {
    enrollments: number;
    modules: number;
  };
}

export default function TrainingSessionsPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/training-sessions');
      const data = await res.json();
      setSessions(data.trainingSessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const dayNames: Record<string, string> = {
    MONDAY: 'Lun',
    TUESDAY: 'Mar',
    WEDNESDAY: 'Mer',
    THURSDAY: 'Jeu',
    FRIDAY: 'Ven',
    SATURDAY: 'Sam',
    SUNDAY: 'Dim'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-violet-400" />
            Formations Complètes
          </h1>
          <p className="text-slate-400">
            Créez des programmes de formation structurés avec modules, horaires et paiements en tranches
            <span className="block mt-1 text-xs text-slate-500">
              💡 Pour un cours simple et rapide, utilisez "Cours rapides"
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/classrooms"
            className="flex items-center gap-2 px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition"
          >
            <BookOpen className="w-4 h-4" />
            Cours rapides
          </Link>
          <Link
            href="/dashboard/training/new"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Formation
          </Link>
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass rounded-xl p-4 mb-6 border border-violet-500/20 bg-violet-500/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-white mb-1">Quand utiliser les "Formations Complètes" ?</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Pour des programmes structurés sur plusieurs semaines/mois</li>
              <li>Quand vous avez besoin de modules, horaires fixes et progression</li>
              <li>Pour gérer des paiements en tranches avec système d'excuse</li>
              <li>Pour suivre la progression des étudiants par module</li>
            </ul>
            <p className="mt-2 text-slate-400">
              <strong>Cours rapides</strong> : Pour un cours ponctuel que vous voulez démarrer immédiatement sans configuration.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="glass rounded-xl p-4">
          <GraduationCap className="w-6 h-6 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
          <p className="text-sm text-slate-400">Sessions créées</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Users className="w-6 h-6 text-cyan-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {sessions.reduce((sum, s) => sum + s._count.enrollments, 0)}
          </p>
          <p className="text-sm text-slate-400">Étudiants inscrits</p>
        </div>
        <div className="glass rounded-xl p-4">
          <BookOpen className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {sessions.reduce((sum, s) => sum + s._count.modules, 0)}
          </p>
          <p className="text-sm text-slate-400">Modules totaux</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Target className="w-6 h-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {sessions.filter(s => s.isActive).length}
          </p>
          <p className="text-sm text-slate-400">Sessions actives</p>
        </div>
      </div>

      {/* Sessions Grid */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl overflow-hidden hover:border-violet-500/30 border border-transparent transition-all group"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-gradient-to-r from-violet-500/5 to-rose-500/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-violet-400" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.isActive 
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {session.isActive ? 'Active' : 'Terminée'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{session.title}</h3>
                {session.description && (
                  <p className="text-sm text-slate-400 line-clamp-2">{session.description}</p>
                )}
              </div>

              {/* Info */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-white/5">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{session._count.enrollments}</div>
                  <div className="text-xs text-slate-500">Étudiants</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{session._count.modules}</div>
                  <div className="text-xs text-slate-500">Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-violet-400">
                    {formatMoney(session.totalPrice)}
                  </div>
                  <div className="text-xs text-slate-500">Prix</div>
                </div>
              </div>

              {/* Dates & Horaires */}
              <div className="px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(session.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {' → '}
                      {new Date(session.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{session.durationWeeks} semaines</span>
                  </div>
                </div>
                
                {/* Horaires */}
                {session.schedules.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {session.schedules.map((schedule, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs"
                      >
                        {dayNames[schedule.dayOfWeek]} {schedule.startTime}-{schedule.endTime}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modules preview */}
              {session.modules.length > 0 && (
                <div className="px-6 py-4 border-b border-white/5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Modules</p>
                  <div className="space-y-2">
                    {session.modules.slice(0, 3).map((module) => (
                      <div 
                        key={module.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                      >
                        <span className="text-sm text-slate-300">{module.title}</span>
                        <span className="text-xs text-slate-500">{module.courses.length} cours</span>
                      </div>
                    ))}
                    {session.modules.length > 3 && (
                      <p className="text-xs text-slate-500 text-center">
                        +{session.modules.length - 3} autres modules
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 flex gap-2">
                <Link
                  href={`/dashboard/training/${session.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Gérer
                </Link>
                <Link
                  href={`/dashboard/training/${session.id}/settings`}
                  className="px-4 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-all"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucune session de formation</h3>
          <p className="text-slate-400 mb-6">
            Créez votre première session de formation avec modules, horaires et paiements en tranches.
          </p>
          <Link
            href="/dashboard/training/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium"
          >
            <Sparkles className="w-5 h-5" />
            Créer avec l'IA
          </Link>
        </div>
      )}
    </div>
  );
}

