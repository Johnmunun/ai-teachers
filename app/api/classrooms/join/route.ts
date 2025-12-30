import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// POST - Rejoindre un cours (étudiant)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { classroomId, code } = await req.json();

    if (!classroomId) {
      return NextResponse.json({ error: 'classroomId requis' }, { status: 400 });
    }

    // Vérifier que le cours existe et est actif
    const classroom = await prisma.classroom.findFirst({
      where: { 
        id: classroomId,
        isActive: true
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Cours non trouvé ou inactif' }, { status: 404 });
    }

    // Vérifier si l'étudiant est déjà inscrit
    const existingEnrollment = await prisma.studentClassroom.findUnique({
      where: {
        studentId_classroomId: { studentId: userId, classroomId }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Vous êtes déjà inscrit à ce cours' }, { status: 400 });
    }

    // Inscrire l'étudiant
    const enrollment = await prisma.studentClassroom.create({
      data: {
        studentId: userId,
        classroomId
      }
    });

    // Créer automatiquement un paiement si le cours a un prix
    if (classroom.price > 0) {
      await prisma.payment.create({
        data: {
          studentId: userId,
          classroomId,
          totalAmount: classroom.price
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      enrollment,
      message: 'Inscription réussie !'
    });
  } catch (error) {
    console.error('Error joining classroom:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Liste des cours disponibles
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Récupérer tous les cours actifs
    const classrooms = await prisma.classroom.findMany({
      where: { isActive: true },
      include: {
        teacher: { select: { name: true, image: true } },
        _count: {
          select: { 
            studentClassrooms: true,
            lessons: true
          }
        },
        studentClassrooms: {
          where: { studentId: userId }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Marquer les cours où l'étudiant est inscrit
    const result = classrooms.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      price: c.price,
      teacher: c.teacher,
      studentCount: c._count.studentClassrooms,
      lessonCount: c._count.lessons,
      isEnrolled: c.studentClassrooms.length > 0
    }));

    return NextResponse.json({ classrooms: result });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

