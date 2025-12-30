import { NextResponse } from 'next/server';
import { createToken } from '@/lib/livekit';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const room = searchParams.get('room');
        const username = searchParams.get('username');
        const role = searchParams.get('role');

        if (!room || !username || !role) {
            return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        // Vérifier que l'utilisateur a accès à cette classe
        if (role === 'student' && userRole === 'STUDENT') {
            // Vérifier que l'étudiant est inscrit au cours
            const enrollment = await prisma.studentClassroom.findFirst({
                where: {
                    studentId: userId,
                    classroomId: room
                }
            });

            if (!enrollment) {
                return NextResponse.json({ 
                    error: 'Vous n\'êtes pas inscrit à ce cours' 
                }, { status: 403 });
            }
        } else if (role === 'teacher' && userRole === 'TEACHER') {
            // Vérifier que l'enseignant est propriétaire du cours
            const classroom = await prisma.classroom.findFirst({
                where: {
                    id: room,
                    teacherId: userId
                }
            });

            if (!classroom) {
                return NextResponse.json({ 
                    error: 'Vous n\'êtes pas autorisé à accéder à ce cours' 
                }, { status: 403 });
            }
        } else {
            return NextResponse.json({ 
                error: 'Rôle invalide ou non autorisé' 
            }, { status: 403 });
        }

        const token = await createToken(room, username, role as 'teacher' | 'student');
        return NextResponse.json({ token });
    } catch (error: any) {
        console.error('Token generation error:', error);
        
        if (error.message?.includes('inscrit') || error.message?.includes('autorisé')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        
        return NextResponse.json({ 
            error: 'Échec de la génération du token', 
            details: error.message || 'Erreur inconnue' 
        }, { status: 500 });
    }
}
