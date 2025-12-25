'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/currency';
import {
  BookOpen,
  Play,
  Settings,
  Calendar,
  GraduationCap
} from 'lucide-react';
import DeleteClassroomButton from './DeleteClassroomButton';

interface ClassroomsClientProps {
  classrooms: any[];
}

export default function ClassroomsClient({ classrooms }: ClassroomsClientProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      {/* Classrooms Grid */}
      {classrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {classrooms.map((classroom) => (
            <div
              key={classroom.id}
              className="glass rounded-xl sm:rounded-2xl overflow-hidden hover:border-cyan-500/30 border border-transparent transition-all group"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      classroom.isActive 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {classroom.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{classroom.title}</h3>
                {classroom.description && (
                  <p className="text-sm text-slate-400 line-clamp-2">{classroom.description}</p>
                )}
              </div>

              {/* Stats */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-white/5">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{classroom._count.studentClassrooms}</div>
                  <div className="text-xs text-slate-500">Étudiants</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{classroom._count.lessons}</div>
                  <div className="text-xs text-slate-500">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400">{formatMoney(classroom.price)}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 flex gap-2">
                <Link
                  href={`/classroom/${classroom.id}/start`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Démarrer
                </Link>
                <Link
                  href={`/dashboard/classrooms/${classroom.id}`}
                  className="px-4 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-all"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <DeleteClassroomButton classroomId={classroom.id} />
              </div>

              {/* Last session info */}
              {classroom.lessons[0] && (
                <div className="px-6 py-3 bg-white/5 text-xs text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  Dernière session : {new Date(classroom.lessons[0].startedAt).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucun cours rapide</h3>
          <p className="text-slate-400 mb-6">Créez votre premier cours pour commencer à enseigner.</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/training"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition"
            >
              <GraduationCap className="w-5 h-5" />
              Voir les formations complètes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

