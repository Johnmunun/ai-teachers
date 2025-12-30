import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Récupérer les sessions actives d'une formation
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

    // Vérifier que la formation appartient à l'enseignant
    const trainingSession = await prisma.trainingSession.findFirst({
      where: { 
        id,
        ...(role === 'TEACHER' && { teacherId: userId })
      }
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 });
    }

    // Récupérer les classrooms liés à cette formation (par titre)
    const classrooms = await prisma.classroom.findMany({
      where: {
        teacherId: trainingSession.teacherId,
        title: {
          contains: trainingSession.title
        }
      },
      include: {
        lessons: {
          where: {
            endedAt: null // Seulement les sessions actives
          },
          include: {
            course: {
              include: {
                module: {
                  select: {
                    id: true,
                    title: true,
                    trainingSessionId: true
                  }
                }
              }
            },
            classroom: {
              include: {
                studentClassrooms: {
                  include: {
                    student: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          }
        }
      }
    });

    // Extraire toutes les sessions actives
    const activeSessions = classrooms.flatMap(classroom => 
      classroom.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        startedAt: lesson.startedAt,
        topics: lesson.topics,
        streamingLink: lesson.streamingLink,
        classroomId: classroom.id,
        classroomTitle: classroom.title,
        course: lesson.course ? {
          id: lesson.course.id,
          title: lesson.course.title,
          module: lesson.course.module
        } : null,
        students: lesson.classroom.studentClassrooms.map(sc => sc.student)
      }))
    );

    return NextResponse.json({ 
      activeSessions,
      trainingSession: {
        id: trainingSession.id,
        title: trainingSession.title
      }
    });
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

