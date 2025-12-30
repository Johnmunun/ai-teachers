import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            id: (session.user as any).id,
            name: session.user.name,
            email: session.user.email,
            role: (session.user as any).role || 'STUDENT',
        });
    } catch (error: any) {
        console.error('Erreur récupération utilisateur:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', message: error.message || 'Erreur inconnue' },
            { status: 500 }
        );
    }
}

