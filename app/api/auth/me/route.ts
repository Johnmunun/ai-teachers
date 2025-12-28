import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// GET - Récupérer les informations de l'utilisateur actuel
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    return NextResponse.json({ 
      user: {
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role,
        isBlocked: (session.user as any).isBlocked || false
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


