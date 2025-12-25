import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatMoney } from '@/lib/currency';
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  Clock,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  Play,
  Plus,
  Edit,
  CheckCircle2,
  Clock as ClockIcon,
  AlertCircle,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';

async function getTrainingSession(id: string, teacherId: string) {
  const session = await prisma.trainingSession.findFirst({
    where: { 
      id,
      teacherId // Vérifier que l'enseignant est propriétaire
    },
    include: {
      teacher: { select: { name: true, email: true } },
      modules: {
        include: {
          courses: {
            orderBy: { orderIndex: 'asc' }
          },
          _count: {
            select: { progressions: true }
          }
        },
        orderBy: { orderIndex: 'asc' }
      },
      schedules: {
        orderBy: { dayOfWeek: 'asc' }
      },
      enrollments: {
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          tranches: {
            orderBy: { dueDate: 'asc' }
          }
        }
      },
      _count: {
        select: { enrollments: true, modules: true }
      }
    }
  });

  return session;
}

const dayNames: Record<string, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche'
};

export default async function TrainingSessionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const role = (session.user as any).role || 'STUDENT';
  if (role !== 'TEACHER') {
    redirect('/dashboard');
  }

  const teacherId = (session.user as any).id;
  const trainingSession = await getTrainingSession(id, teacherId);

  if (!trainingSession) {
    notFound();
  }

  // Calculer les statistiques
  const totalEnrolled = trainingSession.enrollments.length;
  const totalPaid = trainingSession.enrollments.reduce((sum, e) => sum + e.paidAmount, 0);
  const totalExpected = trainingSession.enrollments.reduce((sum, e) => sum + e.totalAmount, 0);
  const completedPayments = trainingSession.enrollments.filter(e => e.status === 'COMPLETED').length;
  const pendingPayments = trainingSession.enrollments.filter(e => e.status === 'PENDING').length;
  const excusedPayments = trainingSession.enrollments.filter(e => e.status === 'EXCUSED').length;

  const totalCourses = trainingSession.modules.reduce((sum, m) => sum + m.courses.length, 0);
  const totalHours = trainingSession.modules.reduce((sum, m) => sum + m.estimatedHours, 0);

  return (
    <div className="p-8">
      {/* Back Button */}
      <Link 
        href="/dashboard/training"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux sessions
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{trainingSession.title}</h1>
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(trainingSession.startDate).toLocaleDateString('fr-FR')} → {new Date(trainingSession.endDate).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {trainingSession.durationWeeks} semaines
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    trainingSession.isActive 
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {trainingSession.isActive ? 'Active' : 'Terminée'}
                  </span>
                </div>
              </div>
            </div>
            {trainingSession.description && (
              <p className="text-slate-300">{trainingSession.description}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/training/${id}/settings`}
              className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button className="px-4 py-2 bg-gradient-to-r from-violet-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition">
              <Play className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalEnrolled}</p>
          <p className="text-xs text-slate-400">Étudiants</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <CreditCard className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{formatMoney(totalPaid)}</p>
          <p className="text-xs text-slate-400">sur {formatMoney(totalExpected)}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <BookOpen className="w-6 h-6 text-violet-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{trainingSession.modules.length}</p>
          <p className="text-xs text-slate-400">Modules</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Target className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalCourses}</p>
          <p className="text-xs text-slate-400">Cours</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <ClockIcon className="w-6 h-6 text-rose-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalHours}h</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Modules */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-400" />
                Modules du programme
              </h2>
              <span className="text-sm text-slate-400">{trainingSession.modules.length} modules</span>
            </div>

            {trainingSession.modules.length > 0 ? (
              <div className="space-y-4">
                {trainingSession.modules.map((module, index) => (
                  <div 
                    key={module.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold text-violet-400">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-slate-400 mb-3">{module.description}</p>
                        )}
                        
                        {/* Objectifs */}
                        {module.objectives && module.objectives.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {module.objectives.slice(0, 3).map((obj, i) => (
                              <span 
                                key={i}
                                className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs"
                              >
                                {obj}
                              </span>
                            ))}
                            {module.objectives.length > 3 && (
                              <span className="px-2 py-1 rounded-full bg-white/10 text-slate-400 text-xs">
                                +{module.objectives.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Cours */}
                        {module.courses.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                              Cours ({module.courses.length})
                            </p>
                            {module.courses.slice(0, 3).map((course) => (
                              <div 
                                key={course.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm"
                              >
                                <span className="text-slate-300">{course.title}</span>
                                <span className="text-slate-500">{course.estimatedMinutes} min</span>
                              </div>
                            ))}
                            {module.courses.length > 3 && (
                              <p className="text-xs text-slate-500 text-center pt-2">
                                +{module.courses.length - 3} autres cours
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span>{module.estimatedHours}h estimées</span>
                          {module._count.progressions > 0 && (
                            <span>{module._count.progressions} étudiants en cours</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun module pour le moment</p>
              </div>
            )}
          </div>

          {/* Horaires */}
          {trainingSession.schedules.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Horaires des cours
              </h2>
              <div className="space-y-3">
                {trainingSession.schedules.map((schedule, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
                  >
                    <div className="w-16 text-sm font-medium text-cyan-400">
                      {dayNames[schedule.dayOfWeek]}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                      {schedule.location && (
                        <div className="text-sm text-slate-400">{schedule.location}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tarification */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Tarification
            </h3>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-emerald-400">
                {formatMoney(trainingSession.totalPrice, trainingSession.currency as any)}
              </p>
              <p className="text-sm text-slate-400 mt-1">Prix total de la formation</p>
            </div>
            
            {/* Tranches planifiées */}
            {trainingSession.plannedTranches && (
              <div className="space-y-2 mt-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Tranches planifiées</p>
                {(trainingSession.plannedTranches as any[]).map((tranche, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm"
                  >
                    <span className="text-slate-300">{tranche.label || `Tranche ${i + 1}`}</span>
                    <div className="text-right">
                      <span className="text-emerald-400 font-medium">
                        {formatMoney((trainingSession.totalPrice * tranche.percent) / 100, trainingSession.currency as any)}
                      </span>
                      <span className="text-slate-500 text-xs ml-2">({tranche.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paiements */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Paiements
              </h3>
              <span className="text-sm text-slate-400">{totalEnrolled} étudiants</span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10">
                <span className="text-sm text-slate-300">Complets</span>
                <span className="text-emerald-400 font-medium">{completedPayments}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10">
                <span className="text-sm text-slate-300">Partiels</span>
                <span className="text-amber-400 font-medium">{trainingSession.enrollments.filter(e => e.status === 'PARTIAL').length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-violet-500/10">
                <span className="text-sm text-slate-300">Excusés</span>
                <span className="text-violet-400 font-medium">{excusedPayments}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10">
                <span className="text-sm text-slate-300">En attente</span>
                <span className="text-red-400 font-medium">{pendingPayments}</span>
              </div>
            </div>

            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                style={{ width: `${totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">
              {((totalPaid / totalExpected) * 100).toFixed(0)}% collecté
            </p>
          </div>

          {/* Actions rapides */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/training/${id}/students`}
                className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Gérer les étudiants
                </span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
              <Link
                href={`/dashboard/training/${id}/payments`}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Gérer les paiements
                </span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
              <Link
                href={`/dashboard/training/${id}/modules`}
                className="flex items-center justify-between p-3 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Modifier les modules
                </span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

