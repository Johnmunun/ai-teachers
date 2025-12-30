'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Users,
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Video
} from 'lucide-react';

interface Classroom {
  id: string;
  title: string;
  description: string;
  studentCount: number;
}

export default function StartSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [topics, setTopics] = useState('');
  const [streamingLink, setStreamingLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch classroom details
    fetch(`/api/classrooms/${id}`)
      .then(res => res.json())
      .then(data => setClassroom(data))
      .catch(console.error);
  }, [id]);

  const startSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: id,
          title: sessionTitle || `Session du ${new Date().toLocaleDateString('fr-FR')}`,
          topics: topics.split(',').map(t => t.trim()).filter(Boolean),
          streamingLink: streamingLink.trim() || null
        })
      });

      const data = await res.json();
      if (data.lessonId) {
        setLessonId(data.lessonId);
        // Redirect to live classroom
        router.push(`/classroom/${id}?lessonId=${data.lessonId}&role=teacher`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!classroom) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Link 
          href="/dashboard/classrooms"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux cours
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-violet-500/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{classroom.title}</h1>
                <p className="text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {classroom.studentCount || 0} étudiants inscrits
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Titre de la session (optionnel)
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder={`Session du ${new Date().toLocaleDateString('fr-FR')}`}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Sujets à aborder (séparés par des virgules)
              </label>
              <textarea
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="Ex: Variables, Boucles for, Fonctions"
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Lien de streaming (optionnel)
              </label>
              <input
                type="url"
                value={streamingLink}
                onChange={(e) => setStreamingLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-yyyy-zzz ou https://zoom.us/j/xxx ou https://youtube.com/watch?v=xxx"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              <p className="mt-2 text-xs text-slate-500">
                Ajoutez un lien vers Google Meet, Zoom, YouTube ou toute autre plateforme de streaming
              </p>
            </div>

            {/* Info */}
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-300">
                    L'IA Nathalie sera active pendant la session pour :
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Analyser et expliquer les concepts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Générer des quiz en temps réel
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Créer un récapitulatif à la fin
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startSession}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-lg font-semibold rounded-xl hover:shadow-xl hover:shadow-emerald-500/25 disabled:opacity-50 transition-all"
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


