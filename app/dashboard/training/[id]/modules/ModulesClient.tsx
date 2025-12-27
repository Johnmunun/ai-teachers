'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Target,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { swal } from '@/lib/swal';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface Module {
  id: string;
  title: string;
  description: string | null;
  objectives: string[];
  orderIndex: number;
  estimatedHours: number;
  courses: Array<{
    id: string;
    title: string;
    description: string | null;
    estimatedMinutes: number;
    orderIndex: number;
  }>;
  _count: {
    progressions: number;
  };
}

interface ModulesClientProps {
  trainingSessionId: string;
  modules: Module[];
}

export default function ModulesClient({ trainingSessionId, modules: initialModules }: ModulesClientProps) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const openModuleForm = async (module?: Module) => {
    const isEdit = Boolean(module);
    const result = await Swal.fire({
      title: isEdit ? 'Modifier le module' : 'Nouveau module',
      html: `
        <input id="swal-module-title" class="swal2-input" placeholder="Titre" />
        <textarea id="swal-module-description" class="swal2-textarea" placeholder="Description (optionnel)"></textarea>
        <input id="swal-module-hours" type="number" class="swal2-input" placeholder="Durée estimée (heures)" min="0" step="1" />
        <textarea id="swal-module-objectives" class="swal2-textarea" placeholder="Objectifs (1 par ligne)"></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: isEdit ? 'Enregistrer' : 'Créer',
      cancelButtonText: 'Annuler',
      focusConfirm: false,
      background: '#0a0f1a',
      color: '#e2e8f0',
      customClass: {
        popup: 'glass border border-white/10',
        title: 'text-white',
        htmlContainer: 'text-slate-300',
        confirmButton: 'bg-cyan-500 hover:bg-cyan-600',
        cancelButton: 'bg-slate-500 hover:bg-slate-600'
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (!popup) return;

        const titleEl = popup.querySelector<HTMLInputElement>('#swal-module-title');
        const descEl = popup.querySelector<HTMLTextAreaElement>('#swal-module-description');
        const hoursEl = popup.querySelector<HTMLInputElement>('#swal-module-hours');
        const objEl = popup.querySelector<HTMLTextAreaElement>('#swal-module-objectives');

        if (titleEl) titleEl.value = module?.title ?? '';
        if (descEl) descEl.value = module?.description ?? '';
        if (hoursEl) hoursEl.value = String(module?.estimatedHours ?? 10);
        if (objEl) objEl.value = (module?.objectives ?? []).join('\n');
      },
      preConfirm: () => {
        const popup = Swal.getPopup();
        if (!popup) return null;

        const titleEl = popup.querySelector<HTMLInputElement>('#swal-module-title');
        const descEl = popup.querySelector<HTMLTextAreaElement>('#swal-module-description');
        const hoursEl = popup.querySelector<HTMLInputElement>('#swal-module-hours');
        const objEl = popup.querySelector<HTMLTextAreaElement>('#swal-module-objectives');

        const title = (titleEl?.value ?? '').trim();
        const description = (descEl?.value ?? '').trim();
        const hoursRaw = (hoursEl?.value ?? '').trim();
        const objectivesRaw = (objEl?.value ?? '').trim();

        if (!title) {
          Swal.showValidationMessage('Le titre est requis.');
          return null;
        }

        const estimatedHours = Math.max(0, Math.round(Number(hoursRaw || 10)));
        if (!Number.isFinite(estimatedHours)) {
          Swal.showValidationMessage('La durée estimée doit être un nombre.');
          return null;
        }

        const objectives = objectivesRaw
          ? objectivesRaw
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        return {
          title,
          description: description || null,
          estimatedHours,
          objectives
        };
      }
    });

    if (!result.isConfirmed || !result.value) return;

    const loadingKey = module?.id ?? 'create-module';
    setLoading(loadingKey);

    try {
      const res = await fetch(
        module
          ? `/api/training-sessions/${trainingSessionId}/modules/${module.id}`
          : `/api/training-sessions/${trainingSessionId}/modules`,
        {
          method: module ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.value)
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        await swal.error('Erreur', data.error || 'Erreur lors de la sauvegarde');
        return;
      }

      const data = await res.json();
      const saved: Module | undefined = data.module;

      if (saved) {
        setModules((prev) => {
          const idx = prev.findIndex((m) => m.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved].sort((a, b) => a.orderIndex - b.orderIndex);
        });
      }

      await swal.success(isEdit ? 'Enregistré !' : 'Créé !', 'Module sauvegardé.');
      router.refresh();
    } catch (error) {
      console.error('Error saving module:', error);
      await swal.error('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteModule = async (moduleId: string, moduleTitle: string) => {
    const result = await swal.delete(
      'Êtes-vous sûr ?',
      `Supprimer le module "${moduleTitle}" et tous ses cours ?`
    );

    if (!result.isConfirmed) {
      return;
    }

    setLoading(moduleId);
    try {
      const res = await fetch(`/api/training-sessions/${trainingSessionId}/modules/${moduleId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setModules((prev) => prev.filter((m) => m.id !== moduleId));
        setExpandedModules((prev) => {
          const next = new Set(prev);
          next.delete(moduleId);
          return next;
        });
        await swal.success('Supprimé !', 'Le module a été supprimé avec succès.');
        router.refresh();
      } else {
        const data = await res.json();
        await swal.error('Erreur', data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      await swal.error('Erreur', 'Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Modules</h2>
          <p className="text-sm text-slate-400">Créez et modifiez la structure de la formation.</p>
        </div>
        <button
          onClick={() => openModuleForm()}
          disabled={loading === 'create-module'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          Ajouter un module
        </button>
      </div>

      {modules.length > 0 ? (
        modules.map((module, index) => {
          const isExpanded = expandedModules.has(module.id);
          
          return (
            <div
              key={module.id}
              className="glass rounded-2xl overflow-hidden border border-white/10"
            >
              <div
                className="p-6 cursor-pointer hover:bg-white/5 transition"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-violet-400">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{module.title}</h3>
                      {module.description && (
                        <p className="text-sm text-slate-400 mb-3">{module.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {module.courses.length} cours
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {module.estimatedHours}h
                        </span>
                        {module._count.progressions > 0 && (
                          <span>{module._count.progressions} étudiants</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModuleForm(module);
                      }}
                      disabled={loading === module.id}
                      className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id, module.title);
                      }}
                      disabled={loading === module.id}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-6 border-t border-white/10 pt-4">
                  {/* Objectives */}
                  {module.objectives && module.objectives.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Objectifs
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {module.objectives.map((obj, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Courses */}
                  {module.courses.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-3">
                        Cours ({module.courses.length})
                      </h4>
                      <div className="space-y-2">
                        {module.courses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                          >
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-slate-500" />
                              <div>
                                <div className="text-sm text-white font-medium">{course.title}</div>
                                {course.description && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    {course.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500">
                                {course.estimatedMinutes} min
                              </span>
                              <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      Aucun cours dans ce module
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucun module</h3>
          <p className="text-slate-400 mb-6">
            Ajoutez des modules pour structurer votre formation.
          </p>
          <button
            onClick={() => openModuleForm()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium"
          >
            <Plus className="w-5 h-5" />
            Ajouter un module
          </button>
        </div>
      )}
    </div>
  );
}

