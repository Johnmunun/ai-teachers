import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Récupérer les cours en cours (lessons actives)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (role === 'TEACHER') {
      // Pour les enseignants : tous les cours en cours de leurs classrooms
      const activeLessons = await prisma.lesson.findMany({
        where: {
          endedAt: null, // Cours non terminé
          classroom: {
            teacherId: userId
          }
        },
        include: {
          classroom: {
            include: {
              teacher: { select: { name: true, image: true } },
              studentClassrooms: {
                include: {
                  student: { 
                    select: { 
                      id: true, 
                      name: true, 
                      email: true,
                      isBlocked: true 
                    } 
                  }
                }
              }
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });

      return NextResponse.json({ activeLessons });
    } else {
      // Pour les étudiants : seulement les cours où ils sont inscrits ET non bloqués
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBlocked: true }
      });

      // Si l'étudiant est bloqué globalement, ne pas retourner de cours
      if (user?.isBlocked) {
        return NextResponse.json({ activeLessons: [] });
      }

      const activeLessons = await prisma.lesson.findMany({
        where: {
          endedAt: null, // Cours non terminé
          classroom: {
            isActive: true,
            studentClassrooms: {
              some: {
                studentId: userId
              }
            }
          }
        },
        include: {
          classroom: {
            include: {
              teacher: { select: { name: true, image: true } }
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      });

      return NextResponse.json({ activeLessons });
    }
  } catch (error) {
    console.error('Error fetching active classrooms:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

