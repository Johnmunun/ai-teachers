import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeEstimatedHours(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  const rounded = Math.round(n);
  return Math.max(0, rounded);
}

// PATCH - Mettre à jour un module
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await params;
    const session = await auth();

    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teacherId = (session.user as any).id as string;
    const body = await req.json();

    // Vérifier que la formation appartient à l'enseignant
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id,
        teacherId
      },
      select: { id: true }
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 });
    }

    // Vérifier que le module appartient à la formation
    const existingModule = await prisma.module.findFirst({
      where: {
        id: moduleId,
        trainingSessionId: id
      },
      select: { id: true }
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    const title = typeof body?.title === 'string' ? body.title.trim() : undefined;
    const description =
      typeof body?.description === 'string' ? body.description.trim() : undefined;
    const objectives = body?.objectives !== undefined ? normalizeStringArray(body.objectives) : undefined;
    const estimatedHours = normalizeEstimatedHours(body?.estimatedHours);

    if (title !== undefined && !title) {
      return NextResponse.json({ error: 'title requis' }, { status: 400 });
    }

    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(objectives !== undefined ? { objectives } : {}),
        ...(estimatedHours !== undefined ? { estimatedHours } : {})
      },
      include: {
        courses: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { progressions: true } }
      }
    });

    revalidatePath(`/dashboard/training/${id}/modules`);
    revalidatePath(`/dashboard/training/${id}`);

    return NextResponse.json({ success: true, module: updatedModule });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un module
export async function DELETE(
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

    // Vérifier que la formation appartient à l'enseignant
    const trainingSession = await prisma.trainingSession.findFirst({
      where: { 
        id,
        teacherId 
      }
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 });
    }

    // Vérifier que le module appartient à la formation
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        trainingSessionId: id
      }
    });

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    // Supprimer le module (les cours seront supprimés en cascade)
    await prisma.module.delete({
      where: { id: moduleId }
    });

    revalidatePath(`/dashboard/training/${id}/modules`);
    revalidatePath(`/dashboard/training/${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

