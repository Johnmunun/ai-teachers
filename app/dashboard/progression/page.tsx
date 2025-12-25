'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Target,
  Award,
  ChevronRight,
  Bell
} from 'lucide-react';
import { formatMoney } from '@/lib/currency';

// Hook to force re-render on currency change
function useCurrencyRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleCurrencyChange = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    window.addEventListener('storage', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
      window.removeEventListener('storage', handleCurrencyChange);
    };
  }, []);

  return refreshKey;
}

interface TrainingSession {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  modules: {
    id: string;
    title: string;
    orderIndex: number;
    estimatedHours: number;
    courses: {
      id: string;
      title: string;
      orderIndex: number;
      estimatedMinutes: number;
    }[];
  }[];
  schedules: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string | null;
  }[];
  enrollments: {
    id: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
  }[];
}

export default function ProgressionPage() {
  const refreshKey = useCurrencyRefresh();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/training-sessions?active=true');
      const data = await res.json();
      const enrolled = (data.trainingSessions || []).filter(
        (s: TrainingSession) => s.enrollments && s.enrollments.length > 0
      );
      setSessions(enrolled);
      if (enrolled.length > 0) {
        setSelectedSession(enrolled[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const dayNames: Record<string, string> = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche'
  };

  const getTodaySchedules = (session: TrainingSession) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    return session.schedules.filter(s => s.dayOfWeek === today);
  };

  const getWeekProgress = () => {
    if (!selectedSession) return 0;
    const start = new Date(selectedSession.startDate);
    const now = new Date();
    const end = new Date(selectedSession.endDate);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  // Simuler la progression des cours (dans un vrai système, ça viendrait de la DB)
  const getCourseProgress = (courseId: string) => {
    // Simulation aléatoire pour la démo
    const hash = courseId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return hash % 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-8">
        <div className="glass rounded-2xl p-12 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucune formation en cours</h3>
          <p className="text-slate-400 mb-6">
            Inscrivez-vous à une session de formation pour suivre votre progression.
          </p>
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium"
          >
            <BookOpen className="w-5 h-5" />
            Voir les formations
          </Link>
        </div>
      </div>
    );
  }

  const enrollment = selectedSession?.enrollments[0];
  const todaySchedules = selectedSession ? getTodaySchedules(selectedSession) : [];
  const weekProgress = getWeekProgress();

  return (
    <div key={refreshKey} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-cyan-400" />
          Ma Progression
        </h1>
        <p className="text-slate-400">Suivez votre avancement dans vos formations</p>
      </div>

      {/* Session Selector */}
      {sessions.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedSession?.id === session.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {session.title}
            </button>
          ))}
        </div>
      )}

      {selectedSession && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            {todaySchedules.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-r from-cyan-500/5 to-violet-500/5"
              >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  Cours aujourd'hui
                </h2>
                <div className="space-y-3">
                  {todaySchedules.map((schedule, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {schedule.startTime} - {schedule.endTime}
                          </p>
                          {schedule.location && (
                            <p className="text-sm text-slate-400">{schedule.location}</p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/classroom/${selectedSession.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                      >
                        <Play className="w-4 h-4" />
                        Rejoindre
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Week Progress */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-400" />
                  Progression de la formation
                </h2>
                <span className="text-cyan-400 font-medium">{weekProgress.toFixed(0)}%</span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weekProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-rose-500 rounded-full"
                />
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>
                  Début: {new Date(selectedSession.startDate).toLocaleDateString('fr-FR')}
                </span>
                <span>
                  Fin: {new Date(selectedSession.endDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Modules */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Modules du programme
              </h2>
              
              <div className="space-y-4">
                {selectedSession.modules
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((module, index) => {
                    // Calculer la progression du module
                    const courseProgresses = module.courses.map(c => getCourseProgress(c.id));
                    const moduleProgress = courseProgresses.length > 0
                      ? courseProgresses.reduce((a, b) => a + b, 0) / courseProgresses.length
                      : 0;
                    const isCompleted = moduleProgress >= 100;
                    const isInProgress = moduleProgress > 0 && moduleProgress < 100;

                    return (
                      <motion.div
                        key={module.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isCompleted 
                                ? 'bg-emerald-500/20' 
                                : isInProgress 
                                ? 'bg-cyan-500/20' 
                                : 'bg-white/10'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <span className={`font-bold ${isInProgress ? 'text-cyan-400' : 'text-slate-500'}`}>
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-white">{module.title}</h3>
                                <span className={`text-sm ${
                                  isCompleted ? 'text-emerald-400' : 
                                  isInProgress ? 'text-cyan-400' : 'text-slate-500'
                                }`}>
                                  {moduleProgress.toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    isCompleted ? 'bg-emerald-500' : 'bg-cyan-500'
                                  }`}
                                  style={{ width: `${moduleProgress}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>{module.courses.length} cours</span>
                                <span>{module.estimatedHours}h estimées</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Courses list */}
                        {isInProgress && (
                          <div className="border-t border-white/5 p-4 bg-white/[0.02]">
                            <div className="space-y-2">
                              {module.courses.slice(0, 4).map((course) => {
                                const progress = getCourseProgress(course.id);
                                const done = progress >= 100;
                                
                                return (
                                  <div 
                                    key={course.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition"
                                  >
                                    {done ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : progress > 0 ? (
                                      <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-500" />
                                    )}
                                    <span className={`flex-1 text-sm ${done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                      {course.title}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {course.estimatedMinutes} min
                                    </span>
                                  </div>
                                );
                              })}
                              {module.courses.length > 4 && (
                                <p className="text-xs text-slate-500 text-center pt-2">
                                  +{module.courses.length - 4} autres cours
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Status */}
            {enrollment && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  Mon paiement
                </h3>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-emerald-400">
                    {formatMoney(enrollment.paidAmount)}
                  </p>
                  <p className="text-sm text-slate-400">
                    sur {formatMoney(enrollment.totalAmount)}
                  </p>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(enrollment.paidAmount / enrollment.totalAmount) * 100}%` }}
                  />
                </div>
                <div className={`text-center text-sm px-3 py-1 rounded-full ${
                  enrollment.status === 'COMPLETED' 
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : enrollment.status === 'PARTIAL' || enrollment.status === 'EXCUSED'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {enrollment.status === 'COMPLETED' ? '✓ Payé' : 
                   enrollment.status === 'PARTIAL' ? 'Partiel' : 
                   enrollment.status === 'EXCUSED' ? 'Excusé' : 'En attente'}
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-400" />
                Horaires
              </h3>
              <div className="space-y-3">
                {selectedSession.schedules.map((schedule, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="text-sm font-medium text-violet-400 w-16">
                      {dayNames[schedule.dayOfWeek]?.slice(0, 3)}
                    </div>
                    <div className="text-sm text-slate-300">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Link
                  href="/dashboard/revisions"
                  className="flex items-center justify-between p-3 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition"
                >
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Réviser avec l'IA
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard/payments"
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                >
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Mes paiements
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

