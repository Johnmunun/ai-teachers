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

function normalizeEstimatedHours(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 10;
  const rounded = Math.round(n);
  return Math.max(0, rounded);
}

// POST - Créer un module dans une session de formation
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teacherId = (session.user as any).id as string;
    const body = await req.json();

    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description =
      typeof body?.description === 'string' ? body.description.trim() : null;
    const objectives = normalizeStringArray(body?.objectives);
    const estimatedHours = normalizeEstimatedHours(body?.estimatedHours);

    if (!title) {
      return NextResponse.json({ error: 'title requis' }, { status: 400 });
    }

    // Vérifier que la session appartient à l'enseignant
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

    const maxOrder = await prisma.module.aggregate({
      where: { trainingSessionId: id },
      _max: { orderIndex: true }
    });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    const createdModule = await prisma.module.create({
      data: {
        trainingSessionId: id,
        title,
        description: description || null,
        objectives,
        estimatedHours,
        orderIndex
      },
      include: {
        courses: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { progressions: true } }
      }
    });

    revalidatePath(`/dashboard/training/${id}/modules`);
    revalidatePath(`/dashboard/training/${id}`);

    return NextResponse.json({ success: true, module: createdModule });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

