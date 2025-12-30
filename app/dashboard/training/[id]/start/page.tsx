'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  BookOpen,
  Users,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { swal } from '@/lib/swal';

interface TrainingSession {
  id: string;
  title: string;
  description: string | null;
  modules: Array<{
    id: string;
    title: string;
    courses: Array<{ id: string; title: string }>;
  }>;
}

export default function StartTrainingSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/training-sessions/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.trainingSession) {
            setTrainingSession(data.trainingSession);
            if (data.trainingSession.modules && data.trainingSession.modules.length > 0) {
              setSelectedModule(data.trainingSession.modules[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [id]);

  const startSession = async () => {
    if (!selectedModule) {
      await swal.error('Erreur', 'Veuillez sélectionner un module');
      return;
    }

    setIsLoading(true);
    try {
      // Pour une formation, on crée une session de cours
      // On pourrait créer un Classroom temporaire ou utiliser un système de sessions de formation
      const res = await fetch('/api/training-sessions/start-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingSessionId: id,
          moduleId: selectedModule,
          title: sessionTitle || `Session du ${new Date().toLocaleDateString('fr-FR')}`
        })
      });

      const data = await res.json();
      
      if (res.ok && data.lessonId) {
        await swal.success('Session démarrée !', 'La session de formation a été créée avec succès.');
        // Rediriger vers la page de la session ou le dashboard
        router.push(`/dashboard/training/${id}`);
      } else {
        throw new Error(data.error || 'Erreur lors du démarrage de la session');
      }
    } catch (error: any) {
      console.error('Error starting session:', error);
      await swal.error('Erreur', error.message || 'Une erreur est survenue lors du démarrage de la session');
    } finally {
      setIsLoading(false);
    }
  };

  if (!trainingSession) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/dashboard/training/${id}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-cyan-500/20"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Démarrer une session</h1>
            <p className="text-slate-400">{trainingSession.title}</p>
          </div>

          <div className="space-y-6">
            {/* Session Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Titre de la session
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder={`Session du ${new Date().toLocaleDateString('fr-FR')}`}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {/* Module Selection */}
            {trainingSession.modules && trainingSession.modules.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Module à enseigner
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {trainingSession.modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title} ({module.courses?.length || 0} cours)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-300 mb-2">
                    Cette session sera enregistrée dans l'historique de la formation.
                  </p>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Les étudiants inscrits pourront y accéder
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      L'IA Nathalie sera disponible pendant la session
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startSession}
              disabled={isLoading || !selectedModule}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-500 to-rose-500 text-white text-lg font-semibold rounded-xl hover:shadow-xl hover:shadow-violet-500/25 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  Démarrer la session
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


