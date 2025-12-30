import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';

const ExerciseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  estimatedTime: z.number().optional(), // en minutes
});

const ExercisesUpdateSchema = z.object({
  exercises: z.array(ExerciseSchema)
});

// GET - Récupérer les exercices d'un module
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        trainingSessionId: id
      },
      select: {
        id: true,
        title: true,
        exercises: true
      }
    });

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      exercises: module.exercises || []
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Ajouter/mettre à jour les exercices d'un module
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teacherId = (session.user as any).id;

    // Vérifier que le module appartient à une formation de l'enseignant
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        trainingSessionId: id,
        trainingSession: {
          teacherId
        }
      }
    });

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    const body = await req.json();
    const validation = ExercisesUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { exercises } = validation.data;

    // Mettre à jour les exercices
    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: {
        exercises: exercises as any
      }
    });

    return NextResponse.json({
      success: true,
      exercises: updated.exercises
    });
  } catch (error) {
    console.error('Error updating exercises:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


