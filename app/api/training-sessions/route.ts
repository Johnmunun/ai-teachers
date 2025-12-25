import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Liste des sessions de formation
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    let trainingSessions;

    if (role === 'TEACHER') {
      // Enseignant: ses propres sessions
      trainingSessions = await prisma.trainingSession.findMany({
        where: { 
          teacherId: userId,
          ...(activeOnly && { isActive: true })
        },
        include: {
          modules: {
            include: {
              courses: true
            },
            orderBy: { orderIndex: 'asc' }
          },
          schedules: true,
          enrollments: {
            include: {
              student: { select: { id: true, name: true, email: true } }
            }
          },
          _count: {
            select: { enrollments: true, modules: true }
          }
        },
        orderBy: { startDate: 'desc' }
      });
    } else {
      // Étudiant: sessions où il est inscrit + sessions disponibles
      trainingSessions = await prisma.trainingSession.findMany({
        where: { 
          isActive: true,
          OR: [
            { enrollments: { some: { studentId: userId } } },
            {} // Toutes les sessions actives
          ]
        },
        include: {
          teacher: { select: { name: true, image: true } },
          modules: {
            include: {
              courses: true
            },
            orderBy: { orderIndex: 'asc' }
          },
          schedules: true,
          enrollments: {
            where: { studentId: userId }
          },
          _count: {
            select: { enrollments: true, modules: true }
          }
        },
        orderBy: { startDate: 'desc' }
      });
    }

    return NextResponse.json({ trainingSessions });
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une session de formation
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teacherId = (session.user as any).id;
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      durationWeeks,
      totalPrice,
      currency,
      plannedTranches,
      schedules,
      modules
    } = await req.json();

    if (!title || !startDate) {
      return NextResponse.json({ error: 'title et startDate requis' }, { status: 400 });
    }

    // Calculer la date de fin si non fournie
    const start = new Date(startDate);
    const weeks = durationWeeks || 12;
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);

    // Créer la session de formation
    const trainingSession = await prisma.trainingSession.create({
      data: {
        title,
        description,
        teacherId,
        startDate: start,
        endDate: end,
        durationWeeks: weeks,
        totalPrice: totalPrice || 0,
        currency: currency || 'XAF',
        plannedTranches: plannedTranches || [
          { percent: 30, dueWeek: 1, label: 'Première tranche' },
          { percent: 40, dueWeek: 6, label: 'Deuxième tranche' },
          { percent: 30, dueWeek: 10, label: 'Troisième tranche' }
        ],
        // Créer les horaires
        schedules: schedules ? {
          create: schedules.map((s: any) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isRecurring: s.isRecurring ?? true,
            location: s.location
          }))
        } : undefined,
        // Créer les modules
        modules: modules ? {
          create: modules.map((m: any, index: number) => ({
            title: m.title,
            description: m.description,
            objectives: m.objectives || [],
            orderIndex: index,
            estimatedHours: m.estimatedHours || 10,
            aiGeneratedContent: m.aiGeneratedContent,
            courses: m.courses ? {
              create: m.courses.map((c: any, cIndex: number) => ({
                title: c.title,
                description: c.description,
                content: c.content,
                orderIndex: cIndex,
                aiOutline: c.aiOutline,
                aiExercises: c.aiExercises,
                estimatedMinutes: c.estimatedMinutes || 60
              }))
            } : undefined
          }))
        } : undefined
      },
      include: {
        modules: {
          include: { courses: true }
        },
        schedules: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      trainingSession 
    });
  } catch (error) {
    console.error('Error creating training session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

