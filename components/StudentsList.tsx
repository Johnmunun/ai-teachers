'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Ban, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  isBlocked: boolean;
}

interface StudentsListProps {
  classroomId: string;
  lessonId: string | null;
}

export default function StudentsList({ classroomId, lessonId }: StudentsListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [classroomId]);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (studentId: string, currentStatus: boolean) => {
    if (!lessonId) return;
    
    setBlocking(studentId);
    try {
      const res = await fetch('/api/students/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          lessonId,
          isBlocked: !currentStatus
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Mettre à jour le statut local
        setStudents(prev => prev.map(s => 
          s.id === studentId 
            ? { ...s, isBlocked: data.student.isBlocked }
            : s
        ));
      }
    } catch (error) {
      console.error('Error blocking student:', error);
    } finally {
      setBlocking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Users className="w-4 h-4" />
          Étudiants ({students.length})
        </h4>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {students.length > 0 ? (
          students.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border transition-all ${
                student.isBlocked
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      student.isBlocked ? 'bg-red-400' : 'bg-emerald-400'
                    }`} />
                    <p className="text-sm font-medium text-white truncate">
                      {student.name}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {student.email}
                  </p>
                </div>
                <button
                  onClick={() => handleBlockToggle(student.id, student.isBlocked)}
                  disabled={blocking === student.id || !lessonId}
                  className={`ml-2 p-1.5 rounded-lg transition-all disabled:opacity-50 ${
                    student.isBlocked
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                  title={student.isBlocked ? 'Débloquer' : 'Bloquer'}
                >
                  {blocking === student.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : student.isBlocked ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                </button>
              </div>
              {student.isBlocked && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Bloqué dans ce cours
                </p>
              )}
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            Aucun étudiant inscrit
          </p>
        )}
      </div>
    </div>
  );
}

