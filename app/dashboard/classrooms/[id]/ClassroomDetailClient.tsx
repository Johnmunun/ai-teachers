'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/currency';
import EditClassroomModal from '@/components/EditClassroomModal';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Play,
  Calendar,
  CreditCard,
  Plus,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  Edit,
  Settings
} from 'lucide-react';

interface ClassroomDetailClientProps {
  classroom: any;
  addStudentAction: (formData: FormData) => Promise<void>;
  removeStudentAction: (formData: FormData) => Promise<void>;
}

export default function ClassroomDetailClient({ 
  classroom, 
  addStudentAction, 
  removeStudentAction 
}: ClassroomDetailClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditSuccess = () => {
    setRefreshKey(prev => prev + 1);
    window.location.reload();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/classrooms"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux cours
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{classroom.title}</h1>
            {classroom.description && (
              <p className="text-slate-400">{classroom.description}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <Link
              href={`/classroom/${classroom.id}/start`}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              <Play className="w-5 h-5" />
              Démarrer une session
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Students */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Étudiants ({classroom.studentClassrooms.length})
              </h2>
            </div>

            {/* Add Student Form */}
            <form action={addStudentAction} className="flex gap-3 mb-6">
              <input type="hidden" name="classroomId" value={classroom.id} />
              <input type="hidden" name="totalAmount" value={classroom.price} />
              <input
                type="email"
                name="email"
                required
                placeholder="Email de l'étudiant"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter
              </button>
            </form>

            {/* Students List */}
            {classroom.studentClassrooms.length > 0 ? (
              <div className="space-y-3">
                {classroom.studentClassrooms.map(({ student }: any) => {
                  const payment = student.payments[0];
                  const paymentPercent = payment 
                    ? (payment.paidAmount / payment.totalAmount) * 100 
                    : 0;

                  return (
                    <div 
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white font-medium">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{student.name}</div>
                          <div className="text-sm text-slate-500">{student.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {payment && (
                          <div className="text-right">
                            <div className="text-sm text-white">
                              {formatMoney(payment.paidAmount)} / {formatMoney(payment.totalAmount)}
                            </div>
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full rounded-full ${
                                  payment.status === 'COMPLETED' 
                                    ? 'bg-emerald-500' 
                                    : 'bg-gradient-to-r from-cyan-500 to-violet-500'
                                }`}
                                style={{ width: `${paymentPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <form action={removeStudentAction}>
                          <input type="hidden" name="classroomId" value={classroom.id} />
                          <input type="hidden" name="studentId" value={student.id} />
                          <button
                            type="submit"
                            className="p-2 text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                Aucun étudiant inscrit. Ajoutez des étudiants pour commencer.
              </p>
            )}
          </div>

          {/* Sessions History */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-violet-400" />
              Historique des sessions ({classroom.lessons.length})
            </h2>

            {classroom.lessons.length > 0 ? (
              <div className="space-y-3">
                {classroom.lessons.map((lesson: any) => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/sessions/${lesson.id}`}
                    className="block p-4 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white group-hover:text-violet-400 transition">
                          {lesson.title || `Session du ${new Date(lesson.startedAt).toLocaleDateString('fr-FR')}`}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(lesson.startedAt).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {lesson._count.quizzes} quiz
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        lesson.endedAt 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {lesson.endedAt ? 'Terminée' : 'En cours'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                Aucune session pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Prix du cours</span>
                <span className="text-white font-medium">{formatMoney(classroom.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Étudiants</span>
                <span className="text-white font-medium">{classroom.studentClassrooms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sessions</span>
                <span className="text-white font-medium">{classroom.lessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Créé le</span>
                <span className="text-white font-medium">
                  {new Date(classroom.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              <Link
                href={`/classroom/${classroom.id}/start`}
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <Play className="w-5 h-5" />
                Démarrer une session
              </Link>
              <Link
                href={`/dashboard/classrooms/${classroom.id}/grades`}
                className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition"
              >
                <FileText className="w-5 h-5" />
                Voir les notes
              </Link>
            </div>
          </div>
        </div>
      </div>

      <EditClassroomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classroom={{
          id: classroom.id,
          title: classroom.title,
          description: classroom.description,
          price: classroom.price,
          isActive: classroom.isActive ?? true
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

