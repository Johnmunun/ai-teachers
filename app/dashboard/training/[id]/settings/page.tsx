'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { swal } from '@/lib/swal';
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  CreditCard,
  Settings as SettingsIcon,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { formatMoney, getCurrencyList, CurrencyCode } from '@/lib/currency';

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
  plannedTranches: any;
  schedules: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location: string | null;
  }[];
}

const dayOptions = [
  { value: 'MONDAY', label: 'Lundi' },
  { value: 'TUESDAY', label: 'Mardi' },
  { value: 'WEDNESDAY', label: 'Mercredi' },
  { value: 'THURSDAY', label: 'Jeudi' },
  { value: 'FRIDAY', label: 'Vendredi' },
  { value: 'SATURDAY', label: 'Samedi' },
  { value: 'SUNDAY', label: 'Dimanche' }
];

export default function TrainingSessionSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<TrainingSession | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/training-sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(data.trainingSession);
        setSchedules(data.trainingSession.schedules || []);
      } else {
        setError('Session non trouvée');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`/api/training-sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          durationWeeks: formData.durationWeeks,
          totalPrice: formData.totalPrice,
          currency: formData.currency,
          isActive: formData.isActive,
          plannedTranches: formData.plannedTranches,
          schedules
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/training/${id}`);
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await swal.delete(
      'Êtes-vous sûr ?',
      'Supprimer cette session de formation et toutes ses données ?'
    );

    if (!result.isConfirmed) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/training-sessions/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await swal.success('Supprimé !', 'La session a été supprimée avec succès.');
        router.push('/dashboard/training');
      } else {
        const data = await res.json();
        await swal.error('Erreur', data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      await swal.error('Erreur', 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const addSchedule = () => {
    setSchedules([...schedules, { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00', location: '' }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: string, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-8">
        <div className="glass rounded-2xl p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Session non trouvée</h3>
          <Link href="/dashboard/training" className="text-cyan-400 hover:underline">
            Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/dashboard/training/${id}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la session
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-cyan-400" />
          Paramètres de la session
        </h1>
        <p className="text-slate-400">Modifiez les informations de votre session de formation</p>
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">Modifications sauvegardées avec succès !</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Informations de base */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Informations de base</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Titre</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date de début</label>
                <input
                  type="date"
                  value={formData.startDate.split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date de fin</label>
                <input
                  type="date"
                  value={formData.endDate.split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded bg-white/5 border border-white/10 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isActive" className="text-slate-300">
                Session active
              </label>
            </div>
          </div>
        </div>

        {/* Tarification */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Tarification
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Prix total</label>
              <input
                type="number"
                value={formData.totalPrice || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, totalPrice: val >= 0 ? val : 0 });
                }}
                min={0}
                step={1000}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Devise</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
              >
                {getCurrencyList().map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Horaires */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Horaires
            </h2>
            <button
              onClick={addSchedule}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {schedules.map((schedule, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5"
              >
                <select
                  value={schedule.dayOfWeek}
                  onChange={(e) => updateSchedule(index, 'dayOfWeek', e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  {dayOptions.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                
                <input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
                
                <span className="text-slate-500">→</span>
                
                <input
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
                
                <input
                  type="text"
                  value={schedule.location || ''}
                  onChange={(e) => updateSchedule(index, 'location', e.target.value)}
                  placeholder="Lieu (optionnel)"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500"
                />
                
                <button
                  onClick={() => removeSchedule(index)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {schedules.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun horaire défini</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition disabled:opacity-50"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Supprimer la session
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium rounded-xl hover:shadow-lg transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

