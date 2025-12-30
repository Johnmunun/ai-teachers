import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Récupérer la progression d'une formation pour un étudiant ou tous les étudiants
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    // Vérifier que la formation existe
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            courses: true
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 });
    }

    if (role === 'TEACHER') {
      // Enseignant: progression de tous les étudiants ou d'un étudiant spécifique
      const enrollments = await prisma.studentEnrollment.findMany({
        where: {
          trainingSessionId: id,
          ...(studentId && { studentId })
        },
        include: {
          student: { select: { id: true, name: true, email: true } }
        }
      });

      const progressions = await Promise.all(
        enrollments.map(async (enrollment) => {
          const moduleProgressions = await prisma.moduleProgression.findMany({
            where: {
              moduleId: { in: trainingSession.modules.map(m => m.id) },
              studentId: enrollment.studentId
            }
          });

          const courseProgressions = await prisma.courseProgression.findMany({
            where: {
              courseId: { in: trainingSession.modules.flatMap(m => m.courses.map(c => c.id)) },
              studentId: enrollment.studentId
            }
          });

          const totalModules = trainingSession.modules.length;
          const completedModules = moduleProgressions.filter(mp => mp.progress === 100).length;
          const totalCourses = trainingSession.modules.reduce((sum, m) => sum + m.courses.length, 0);
          const completedCourses = courseProgressions.filter(cp => cp.progress === 100).length;

          const overallProgress = totalModules > 0
            ? ((completedModules / totalModules) * 100)
            : 0;

          return {
            student: enrollment.student,
            enrollment,
            moduleProgressions,
            courseProgressions,
            stats: {
              totalModules,
              completedModules,
              totalCourses,
              completedCourses,
              overallProgress: Math.round(overallProgress)
            }
          };
        })
      );

      return NextResponse.json({ progressions });
    } else {
      // Étudiant: sa propre progression
      const enrollment = await prisma.studentEnrollment.findFirst({
        where: {
          trainingSessionId: id,
          studentId: userId
        }
      });

      if (!enrollment) {
        return NextResponse.json({ error: 'Non inscrit à cette formation' }, { status: 403 });
      }

      const moduleProgressions = await prisma.moduleProgression.findMany({
        where: {
          moduleId: { in: trainingSession.modules.map(m => m.id) },
          studentId: userId
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              orderIndex: true
            }
          }
        }
      });

      const courseProgressions = await prisma.courseProgression.findMany({
        where: {
          courseId: { in: trainingSession.modules.flatMap(m => m.courses.map(c => c.id)) },
          studentId: userId
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              orderIndex: true,
              moduleId: true
            }
          }
        }
      });

      const totalModules = trainingSession.modules.length;
      const completedModules = moduleProgressions.filter(mp => mp.progress === 100).length;
      const totalCourses = trainingSession.modules.reduce((sum, m) => sum + m.courses.length, 0);
      const completedCourses = courseProgressions.filter(cp => cp.progress === 100).length;

      const overallProgress = totalModules > 0
        ? ((completedModules / totalModules) * 100)
        : 0;

      return NextResponse.json({
        studentId: userId,
        moduleProgressions,
        courseProgressions,
        stats: {
          totalModules,
          completedModules,
          totalCourses,
          completedCourses,
          overallProgress: Math.round(overallProgress)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

