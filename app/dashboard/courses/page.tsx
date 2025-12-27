'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  Calendar,
  CreditCard,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Play,
  Clock
} from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { swal } from '@/lib/swal';

interface Classroom {
  id: string;
  title: string;
  description: string | null;
  price: number;
  teacher: { name: string; image: string | null };
  studentCount: number;
  lessonCount: number;
  isEnrolled: boolean;
}

interface ActiveLesson {
  id: string;
  title: string | null;
  startedAt: string;
  classroom: {
    id: string;
    title: string;
    teacher: { name: string; image: string | null };
  };
}

export default function StudentCoursesPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeLessons, setActiveLessons] = useState<ActiveLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');
  const [joining, setJoining] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchClassrooms();
    fetchActiveLessons();
    
    // Rafraîchir les cours en cours toutes les 10 secondes
    const interval = setInterval(() => {
      fetchActiveLessons();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Force re-render when currency changes
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

  const fetchClassrooms = async () => {
    try {
      const res = await fetch('/api/classrooms/join');
      const data = await res.json();
      setClassrooms(data.classrooms || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveLessons = async () => {
    try {
      const res = await fetch('/api/classrooms/active');
      const data = await res.json();
      setActiveLessons(data.activeLessons || []);
    } catch (error) {
      console.error('Error fetching active lessons:', error);
    }
  };

  const handleJoin = async (classroomId: string) => {
    setJoining(classroomId);
    try {
      const res = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId })
      });

      if (res.ok) {
        await swal.success('Inscription réussie !', 'Vous êtes maintenant inscrit à ce cours.');
        // Refresh list
        await fetchClassrooms();
      } else {
        const data = await res.json();
        await swal.error('Erreur', data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Error joining classroom:', error);
    } finally {
      setJoining(null);
    }
  };

  const filteredClassrooms = classrooms.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' ||
                         (filter === 'enrolled' && c.isEnrolled) ||
                         (filter === 'available' && !c.isEnrolled);
    return matchesSearch && matchesFilter;
  });

  const enrolledCount = classrooms.filter(c => c.isEnrolled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div key={refreshKey} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mes Cours</h1>
        <p className="text-slate-400">Découvrez et inscrivez-vous aux cours disponibles</p>
      </div>

      {/* Active Lessons - Cours en cours */}
      {activeLessons.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              Cours en cours
            </h2>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
              {activeLessons.length} {activeLessons.length === 1 ? 'cours actif' : 'cours actifs'}
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeLessons.map((lesson) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-5 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {lesson.classroom.title}
                    </h3>
                    {lesson.title && (
                      <p className="text-sm text-slate-400">{lesson.title}</p>
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>
                    Démarré {new Date(lesson.startedAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <a
                  href={`/classroom/${lesson.classroom.id}?role=student&lessonId=${lesson.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Rejoindre le cours
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4">
          <BookOpen className="w-6 h-6 text-cyan-400 mb-2" />
          <p className="text-2xl font-bold text-white">{enrolledCount}</p>
          <p className="text-sm text-slate-400">Cours inscrits</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Calendar className="w-6 h-6 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-white">{classrooms.length}</p>
          <p className="text-sm text-slate-400">Cours disponibles</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Clock className="w-6 h-6 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {classrooms.reduce((sum, c) => sum + (c.isEnrolled ? c.lessonCount : 0), 0)}
          </p>
          <p className="text-sm text-slate-400">Sessions suivies</p>
        </div>
        <div className="glass rounded-xl p-4">
          <Users className="w-6 h-6 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">
            {new Set(classrooms.filter(c => c.isEnrolled).map(c => c.teacher.name)).size}
          </p>
          <p className="text-sm text-slate-400">Enseignants</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'enrolled', label: 'Inscrits' },
              { key: 'available', label: 'Disponibles' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === key
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <AnimatePresence mode="popLayout">
        {filteredClassrooms.length > 0 ? (
          <motion.div 
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredClassrooms.map((classroom) => (
              <motion.div
                key={classroom.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass rounded-2xl overflow-hidden border transition-all ${
                  classroom.isEnrolled 
                    ? 'border-emerald-500/30' 
                    : 'border-transparent hover:border-cyan-500/30'
                }`}
              >
                {/* Header */}
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-cyan-400" />
                    </div>
                    {classroom.isEnrolled && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Inscrit
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{classroom.title}</h3>
                  {classroom.description && (
                    <p className="text-sm text-slate-400 line-clamp-2">{classroom.description}</p>
                  )}
                </div>

                {/* Info */}
                <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-white/5">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{classroom.studentCount}</div>
                    <div className="text-xs text-slate-500">Étudiants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{classroom.lessonCount}</div>
                    <div className="text-xs text-slate-500">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-cyan-400">
                      {classroom.price > 0 ? formatMoney(classroom.price) : 'Gratuit'}
                    </div>
                    <div className="text-xs text-slate-500">Prix</div>
                  </div>
                </div>

                {/* Teacher */}
                <div className="px-6 py-3 flex items-center gap-3 border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white text-sm font-medium">
                    {classroom.teacher.name.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-400">Enseignant: </span>
                    <span className="text-white">{classroom.teacher.name}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="p-4">
                  {classroom.isEnrolled ? (
                    <a
                      href={`/dashboard/history`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/20 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Accéder au cours
                    </a>
                  ) : (
                    <button
                      onClick={() => handleJoin(classroom.id)}
                      disabled={joining === classroom.id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                    >
                      {joining === classroom.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Inscription...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          S'inscrire
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucun cours trouvé</h3>
            <p className="text-slate-400">
              {searchTerm ? 'Aucun cours ne correspond à votre recherche.' : 'Aucun cours disponible pour le moment.'}
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

