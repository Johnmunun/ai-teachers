import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ConfusionDetectionSchema = z.object({
    studentId: z.string().uuid(),
    lessonId: z.string().uuid(),
    score: z.number().min(0).max(1), // Score de confusion 0-1
    reason: z.string().optional(),
    context: z.record(z.string(), z.any()).optional(), // Record avec string keys et any values
});

/**
 * Détecte un événement de confusion pour un étudiant
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const validation = ConfusionDetectionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { studentId, lessonId, score, reason, context } = validation.data;

        // Vérifier que l'étudiant existe
        const student = await prisma.user.findUnique({
            where: { id: studentId },
        });

        if (!student || student.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 });
        }

        // Vérifier que la leçon existe
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Leçon non trouvée' }, { status: 404 });
        }

        // Créer l'événement de confusion
        const confusionEvent = await prisma.confusionEvent.create({
            data: {
                studentId,
                lessonId,
                score,
                reason,
                context: context || {},
            },
        });

        // Si le score est élevé (>0.7), on pourrait déclencher une alerte
        // Pour l'instant, on retourne juste l'événement créé

        return NextResponse.json({
            success: true,
            confusionEvent,
            alert: score > 0.7 ? 'Confusion élevée détectée' : null,
        });
    } catch (error: any) {
        console.error('Confusion detection error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la détection', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * Récupère les événements de confusion pour un étudiant ou une leçon
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        const lessonId = searchParams.get('lessonId');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!studentId && !lessonId) {
            return NextResponse.json(
                { error: 'studentId ou lessonId requis' },
                { status: 400 }
            );
        }

        const events = await prisma.confusionEvent.findMany({
            where: {
                ...(studentId && { studentId }),
                ...(lessonId && { lessonId }),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                detectedAt: 'desc',
            },
            take: limit,
        });

        // Calculer les statistiques
        const avgScore =
            events.length > 0
                ? events.reduce((sum, e) => sum + e.score, 0) / events.length
                : 0;
        const highConfusionCount = events.filter((e) => e.score > 0.7).length;

        return NextResponse.json({
            events,
            statistics: {
                total: events.length,
                averageScore: avgScore,
                highConfusionCount,
            },
        });
    } catch (error) {
        console.error('Error fetching confusion events:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

