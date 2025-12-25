'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { swal } from '@/lib/swal';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  Users,
  Plus,
  Trash2,
  Check,
  Loader2,
  GraduationCap,
  Brain,
  Target
} from 'lucide-react';
import { formatMoney, getCurrencyList, CurrencyCode } from '@/lib/currency';

interface GeneratedCourse {
  title: string;
  description: string;
  estimatedMinutes: number;
  topics: string[];
  exercises: { title: string; description: string; difficulty: string }[];
}

interface GeneratedModule {
  title: string;
  description: string;
  objectives: string[];
  estimatedHours: number;
  courses: GeneratedCourse[];
}

export default function NewTrainingSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    durationWeeks: 12,
    totalPrice: 150000,
    currency: 'XAF' as CurrencyCode,
    // Tranches planifiées
    plannedTranches: [
      { percent: 30, dueWeek: 1, label: 'Première tranche' },
      { percent: 40, dueWeek: 6, label: 'Deuxième tranche' },
      { percent: 30, dueWeek: 10, label: 'Troisième tranche' }
    ],
    // Horaires
    schedules: [
      { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '12:00', location: '' }
    ],
    // Modules
    modules: [] as GeneratedModule[]
  });

  // AI Generation
  const [aiTopic, setAiTopic] = useState('');
  const [aiLevel, setAiLevel] = useState('débutant');
  const [aiDuration, setAiDuration] = useState('20');

  const dayOptions = [
    { value: 'MONDAY', label: 'Lundi' },
    { value: 'TUESDAY', label: 'Mardi' },
    { value: 'WEDNESDAY', label: 'Mercredi' },
    { value: 'THURSDAY', label: 'Jeudi' },
    { value: 'FRIDAY', label: 'Vendredi' },
    { value: 'SATURDAY', label: 'Samedi' },
    { value: 'SUNDAY', label: 'Dimanche' }
  ];

  const generateWithAI = async () => {
    if (!aiTopic) return;
    
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/course-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          level: aiLevel,
          duration: aiDuration + ' heures'
        })
      });

      const data = await res.json();
      
      if (data.course) {
        // Ajouter le module généré
        const newModule: GeneratedModule = {
          title: data.course.title,
          description: data.course.description,
          objectives: data.course.objectives || [],
          estimatedHours: data.course.estimatedHours || (parseInt(aiDuration) || 20),
          courses: data.course.courses || []
        };

        setFormData(prev => ({
          ...prev,
          modules: [...prev.modules, newModule],
          title: prev.title || `Formation ${data.course.title}`
        }));
      }
    } catch (error) {
      console.error('AI generation error:', error);
      await swal.error('Erreur', 'Erreur lors de la génération par l\'IA');
    } finally {
      setGenerating(false);
    }
  };

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00', location: '' }]
    }));
  };

  const removeSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  const addTranche = () => {
    const totalPercent = formData.plannedTranches.reduce((sum, t) => sum + t.percent, 0);
    const remaining = 100 - totalPercent;
    if (remaining <= 0) return;

    setFormData(prev => ({
      ...prev,
      plannedTranches: [...prev.plannedTranches, { 
        percent: Math.min(remaining, 20), 
        dueWeek: prev.plannedTranches.length + 2, 
        label: `Tranche ${prev.plannedTranches.length + 1}` 
      }]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate)
        })
      });

      if (res.ok) {
        const data = await res.json();
        await swal.success('Session créée !', 'Votre session de formation a été créée avec succès.');
        router.push(`/dashboard/training/${data.trainingSession.id}`);
      } else {
        const errorData = await res.json();
        await swal.error('Erreur', errorData.error || 'Erreur lors de la création de la session');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTranchePercent = formData.plannedTranches.reduce((sum, t) => sum + t.percent, 0);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/training"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux sessions
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-violet-400" />
          Nouvelle Session de Formation
        </h1>
        <p className="text-slate-400">Créez une session complète avec modules, horaires et paiements</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Informations' },
          { num: 2, label: 'Modules & Cours' },
          { num: 3, label: 'Horaires' },
          { num: 4, label: 'Paiements' }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= s.num 
                ? 'bg-violet-500 text-white' 
                : 'bg-white/10 text-slate-500'
            }`}>
              {step > s.num ? <Check className="w-5 h-5" /> : s.num}
            </div>
            <span className={`ml-2 hidden sm:block ${step >= s.num ? 'text-white' : 'text-slate-500'}`}>
              {s.label}
            </span>
            {i < 3 && <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-violet-500' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Informations */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Informations de base
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Titre de la formation</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Formation Développement Web Fullstack"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez le programme de formation..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Date de début</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Durée (semaines)</label>
                  <input
                    type="number"
                    value={formData.durationWeeks || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, durationWeeks: val > 0 ? val : 1 });
                    }}
                    min={1}
                    max={52}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Modules */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* AI Generator */}
            <div className="glass rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-rose-500/5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Génération assistée par IA
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Décrivez le sujet et l'IA générera un module complet avec cours et exercices.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Ex: Programmation Web avec HTML, CSS et JavaScript"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="flex-1 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none"
                  >
                    <option value="débutant">Débutant</option>
                    <option value="intermédiaire">Intermédiaire</option>
                    <option value="avancé">Avancé</option>
                  </select>
                  <input
                    type="number"
                    value={aiDuration || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAiDuration(val ? (parseInt(val) > 0 ? val : '20') : '20');
                    }}
                    placeholder="20h"
                    min={1}
                    className="w-20 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none text-center"
                  />
                </div>
              </div>
              
              <button
                onClick={generateWithAI}
                disabled={generating || !aiTopic}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Générer le module
                  </>
                )}
              </button>
            </div>

            {/* Modules List */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Modules ({formData.modules.length})
              </h3>

              {formData.modules.length > 0 ? (
                <div className="space-y-4">
                  {formData.modules.map((module, index) => (
                    <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{module.title}</h4>
                          <p className="text-sm text-slate-400">{module.description}</p>
                        </div>
                        <button
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            modules: prev.modules.filter((_, i) => i !== index)
                          }))}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {module.objectives.slice(0, 3).map((obj, i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs">
                            <Target className="w-3 h-3 inline mr-1" />
                            {obj}
                          </span>
                        ))}
                      </div>
                      
                      <div className="text-sm text-slate-500">
                        {module.courses.length} cours • {module.estimatedHours}h estimées
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Utilisez l'IA pour générer des modules ou ajoutez-les manuellement</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Horaires */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Horaires des cours
            </h2>

            <div className="space-y-4">
              {formData.schedules.map((schedule, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].dayOfWeek = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    {dayOptions.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].startTime = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                  
                  <span className="text-slate-500">→</span>
                  
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].endTime = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                  
                  <input
                    type="text"
                    value={schedule.location}
                    onChange={(e) => {
                      const newSchedules = [...formData.schedules];
                      newSchedules[index].location = e.target.value;
                      setFormData({ ...formData, schedules: newSchedules });
                    }}
                    placeholder="Lieu (optionnel)"
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500"
                  />
                  
                  {formData.schedules.length > 1 && (
                    <button
                      onClick={() => removeSchedule(index)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addSchedule}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 text-slate-400 rounded-xl hover:border-violet-500/50 hover:text-violet-400 transition"
              >
                <Plus className="w-5 h-5" />
                Ajouter un créneau
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Paiements */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Tarification et tranches
            </h2>

            <div className="space-y-6">
              {/* Prix total */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Prix total de la formation</label>
                  <input
                    type="number"
                    value={formData.totalPrice || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, totalPrice: val >= 0 ? val : 0 });
                    }}
                    min={0}
                    step={1000}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Devise</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none"
                  >
                    {getCurrencyList().map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tranches */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm text-slate-400">Tranches de paiement</label>
                  <span className={`text-sm ${totalTranchePercent === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Total: {totalTranchePercent}%
                  </span>
                </div>

                <div className="space-y-3">
                  {formData.plannedTranches.map((tranche, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tranche.label}
                          onChange={(e) => {
                            const newTranches = [...formData.plannedTranches];
                            newTranches[index].label = e.target.value;
                            setFormData({ ...formData, plannedTranches: newTranches });
                          }}
                          className="w-full px-3 py-2 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={tranche.percent || ''}
                          onChange={(e) => {
                            const newTranches = [...formData.plannedTranches];
                            const val = parseInt(e.target.value) || 0;
                            newTranches[index].percent = val >= 0 && val <= 100 ? val : tranche.percent;
                            setFormData({ ...formData, plannedTranches: newTranches });
                          }}
                          min={0}
                          max={100}
                          className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Semaine</span>
                        <input
                          type="number"
                          value={tranche.dueWeek || ''}
                          onChange={(e) => {
                            const newTranches = [...formData.plannedTranches];
                            const val = parseInt(e.target.value) || 1;
                            newTranches[index].dueWeek = val >= 1 && val <= formData.durationWeeks ? val : tranche.dueWeek;
                            setFormData({ ...formData, plannedTranches: newTranches });
                          }}
                          min={1}
                          max={formData.durationWeeks}
                          className="w-16 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center"
                        />
                      </div>
                      <div className="text-right min-w-[100px]">
                        <span className="text-emerald-400 font-medium">
                          {formatMoney((formData.totalPrice * tranche.percent) / 100, formData.currency)}
                        </span>
                      </div>
                      {formData.plannedTranches.length > 1 && (
                        <button
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            plannedTranches: prev.plannedTranches.filter((_, i) => i !== index)
                          }))}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {totalTranchePercent < 100 && (
                    <button
                      onClick={addTranche}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 text-slate-400 rounded-xl hover:border-violet-500/50 hover:text-violet-400 transition"
                    >
                      <Plus className="w-5 h-5" />
                      Ajouter une tranche ({100 - totalTranchePercent}% restant)
                    </button>
                  )}
                </div>
              </div>

              {/* Info excuses */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-400 text-sm">
                  💡 Les étudiants pourront s'excuser s'ils ne peuvent pas payer le montant prévu. 
                  Vous pourrez approuver ou refuser leurs excuses et enregistrer le montant réellement payé.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white disabled:opacity-50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Précédent
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-violet-500 text-white font-medium rounded-xl hover:bg-violet-600 transition"
          >
            Suivant
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.startDate}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Créer la session
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

