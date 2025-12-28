import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

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


