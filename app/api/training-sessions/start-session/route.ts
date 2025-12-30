import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { trainingSessionId, moduleId, title } = await req.json();

    if (!trainingSessionId || !moduleId) {
      return NextResponse.json({ 
        error: 'trainingSessionId et moduleId requis' 
      }, { status: 400 });
    }

    const teacherId = (session.user as any).id;

    // Vérifier que la formation appartient à l'enseignant et récupérer les données nécessaires
    const trainingSession = await prisma.trainingSession.findFirst({
      where: { 
        id: trainingSessionId,
        teacherId 
      },
      include: {
        modules: {
          where: { id: moduleId },
          include: {
            courses: {
              orderBy: { orderIndex: 'asc' },
              take: 1 // Prendre le premier cours du module
            }
          }
        },
        enrollments: {
          include: {
            student: true
          }
        }
      }
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 });
    }

    if (!trainingSession.modules || trainingSession.modules.length === 0) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    const module = trainingSession.modules[0];
    const firstCourse = module.courses.length > 0 ? module.courses[0] : null;

    // Créer ou récupérer un Classroom pour cette formation
    let classroom = await prisma.classroom.findFirst({
      where: {
        teacherId,
        title: {
          contains: trainingSession.title
        }
      }
    });

    if (!classroom) {
      // Créer un nouveau Classroom pour cette formation
      classroom = await prisma.classroom.create({
        data: {
          title: `${trainingSession.title} - Session Live`,
          description: `Session de formation: ${trainingSession.title}`,
          teacherId,
          price: 0, // Les paiements sont gérés via les tranches
          isActive: true
        }
      });

      // Inscrire automatiquement tous les étudiants de la formation au Classroom
      const enrollments = trainingSession.enrollments;
      if (enrollments.length > 0 && classroom) {
        await prisma.studentClassroom.createMany({
          data: enrollments.map(enrollment => ({
            studentId: enrollment.studentId,
            classroomId: classroom!.id
          })),
          skipDuplicates: true
        });
      }
    }

    // S'assurer que classroom existe
    if (!classroom) {
      return NextResponse.json({ error: 'Erreur lors de la création du Classroom' }, { status: 500 });
    }

    // Créer la Lesson (session)
    const lesson = await prisma.lesson.create({
      data: {
        classroomId: classroom.id,
        courseId: firstCourse?.id || null,
        title: title || `Session ${module.title} - ${new Date().toLocaleDateString('fr-FR')}`,
        topics: [module.title],
        startedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      lessonId: lesson.id,
      classroomId: classroom.id,
      message: 'Session de formation démarrée'
    });
  } catch (error) {
    console.error('Error starting training session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


