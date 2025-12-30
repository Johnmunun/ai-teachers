'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Users,
  Clock,
  BookOpen,
  ExternalLink,
  Video,
  Calendar
} from 'lucide-react';

interface ActiveSession {
  id: string;
  title: string;
  startedAt: string;
  topics: string[];
  streamingLink: string | null;
  classroomId: string;
  classroomTitle: string;
  course: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
    };
  } | null;
  students: Array<{
    id: string;
    name: string;
    email: string;
    image: string | null;
  }>;
}

interface TrainingSession {
  id: string;
  title: string;
}

export default function TrainingSessionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSessions();
    }
  }, [id]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/training-sessions/${id}/sessions`);
      const data = await res.json();
      if (res.ok) {
        setActiveSessions(data.activeSessions || []);
        setTrainingSession(data.trainingSession);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href={`/dashboard/training/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la formation
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Sessions actives
        </h1>
        {trainingSession && (
          <p className="text-slate-400">{trainingSession.title}</p>
        )}
      </div>

      {activeSessions.length > 0 ? (
        <div className="space-y-6">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              className="glass rounded-2xl p-6 border border-cyan-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {session.title}
                  </h3>
                  {session.course && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{session.course.module.title} → {session.course.title}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Démarrée le {new Date(session.startedAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{session.students.length} étudiant(s)</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/classroom/${session.classroomId}?lessonId=${session.id}&role=teacher`}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition"
                >
                  <Play className="w-4 h-4" />
                  Rejoindre
                </Link>
              </div>

              {/* Topics */}
              {session.topics.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {session.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Streaming Link */}
              {session.streamingLink && (
                <div className="mb-4">
                  <a
                    href={session.streamingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    <Video className="w-4 h-4" />
                    <span>Lien de streaming</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Students */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-slate-300 mb-3">
                  Étudiants connectés ({session.students.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {session.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                    >
                      {student.image ? (
                        <img
                          src={student.image}
                          alt={student.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-medium">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{student.name}</p>
                        <p className="text-xs text-slate-400 truncate">{student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <Play className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Aucune session active
          </h3>
          <p className="text-slate-400 mb-6">
            Aucune session n'est actuellement en cours pour cette formation.
          </p>
          <Link
            href={`/dashboard/training/${id}/start`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium"
          >
            <Play className="w-5 h-5" />
            Démarrer une session
          </Link>
        </div>
      )}
    </div>
  );
}

