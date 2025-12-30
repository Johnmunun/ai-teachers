import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Target,
  Clock
} from 'lucide-react';
import ModulesClient from './ModulesClient';

async function getTrainingSession(id: string, teacherId: string) {
  const session = await prisma.trainingSession.findFirst({
    where: { 
      id,
      teacherId
    },
    include: {
      modules: {
        include: {
          courses: {
            orderBy: { orderIndex: 'asc' }
          },
          _count: {
            select: { progressions: true }
          }
        },
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  return session;
}

export default async function ModulesPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const role = (session.user as any).role || 'STUDENT';
  if (role !== 'TEACHER') {
    redirect('/dashboard');
  }

  const teacherId = (session.user as any).id;
  const trainingSession = await getTrainingSession(id, teacherId);

  if (!trainingSession) {
    notFound();
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
        <h1 className="text-3xl font-bold text-white mb-2">Gérer les modules</h1>
        <p className="text-slate-400">{trainingSession.title}</p>
      </div>

      <ModulesClient 
        trainingSessionId={id}
        modules={trainingSession.modules}
      />
    </div>
  );
}


