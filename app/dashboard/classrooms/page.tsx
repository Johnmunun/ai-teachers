import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { formatMoney } from '@/lib/currency';
import {
  BookOpen,
  Plus,
  Users,
  Play,
  Settings,
  Calendar,
  DollarSign,
  MoreVertical,
  Trash2,
  Edit,
  Info,
  GraduationCap
} from 'lucide-react';
import DeleteClassroomButton from './DeleteClassroomButton';
import ClassroomsClient from './ClassroomsClient';

async function getTeacherClassrooms(teacherId: string) {
  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    include: {
      studentClassrooms: {
        include: { student: true }
      },
      lessons: {
        orderBy: { startedAt: 'desc' },
        take: 1
      },
      _count: {
        select: { 
          studentClassrooms: true,
          lessons: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return classrooms;
}

async function createClassroom(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    throw new Error('Non autorisé');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string) || 0;

  await prisma.classroom.create({
    data: {
      title,
      description,
      price,
      teacherId: (session.user as any).id
    }
  });

  revalidatePath('/dashboard/classrooms');
}

export default async function ClassroomsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if ((session.user as any).role !== 'TEACHER') {
    redirect('/dashboard');
  }

  const userId = (session.user as any).id;
  const classrooms = await getTeacherClassrooms(userId);

  return (
    <>
      {/* Create Classroom Form - Server Component */}
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Cours Rapides</h1>
            <p className="text-slate-400">
              Créez un cours simple et démarrez une session live immédiatement. 
              <span className="block mt-1 text-xs text-slate-500">
                💡 Pour des formations longues avec modules et horaires, utilisez "Formations complètes"
              </span>
            </p>
          </div>
          <Link
            href="/dashboard/training"
            className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl hover:bg-violet-500/20 transition"
          >
            <GraduationCap className="w-4 h-4" />
            Formations complètes
          </Link>
        </div>

        {/* Info Banner */}
        <div className="glass rounded-xl p-4 mb-6 border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-medium text-white mb-1">Quand utiliser les "Cours Rapides" ?</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Pour un cours ponctuel ou une session unique</li>
                <li>Quand vous voulez démarrer immédiatement sans configuration</li>
                <li>Pour des cours libres sans structure de modules</li>
              </ul>
              <p className="mt-2 text-slate-400">
                <strong>Formations complètes</strong> : Pour des programmes structurés sur plusieurs semaines avec modules, horaires fixes et paiements en tranches.
              </p>
            </div>
          </div>
        </div>

        {/* Create Classroom Form */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Créer un cours rapide
          </h2>
          <form action={createClassroom} className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Titre du cours</label>
              <input
                type="text"
                name="title"
                required
                placeholder="Ex: Introduction à JavaScript"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Prix</label>
              <input
                type="number"
                name="price"
                placeholder="50000"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Créer le cours
              </button>
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm text-slate-400 mb-2">Description (optionnel)</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Décrivez le contenu du cours..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Classrooms List - Client Component */}
      <ClassroomsClient classrooms={classrooms} />
    </>
  );
}
