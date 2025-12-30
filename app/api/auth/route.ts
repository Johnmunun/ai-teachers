import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterSchema = z.object({
    action: z.literal('register'),
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    role: z.enum(['TEACHER', 'STUDENT']).optional().default('STUDENT'),
});

const LegacySchema = z.object({
    name: z.string().min(1),
    role: z.enum(['TEACHER', 'STUDENT']),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action } = body;

        // Register new user
        if (action === 'register') {
            const validation = RegisterSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json(
                    { error: 'Données invalides', details: validation.error.issues },
                    { status: 400 }
                );
            }

            const { name, email, password, role } = validation.data;

            // Check if user exists
            let existingUser = null;
            try {
                existingUser = await prisma.user.findUnique({
                    where: { email }
                });
            } catch (dbError) {
                console.error('Database error:', dbError);
                return NextResponse.json(
                    { error: 'Erreur de connexion à la base de données. Vérifiez DATABASE_URL.' },
                    { status: 500 }
                );
            }

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Cet email est déjà utilisé' },
                    { status: 400 }
                );
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            });

            return NextResponse.json({ 
                success: true, 
                user,
                message: 'Compte créé avec succès'
            });
        }

        // Legacy: Simple get or create (for demo/testing)
        const legacyValidation = LegacySchema.safeParse(body);

        if (!legacyValidation.success) {
            return NextResponse.json(
                { error: 'Name and role are required', details: legacyValidation.error.issues },
                { status: 400 }
            );
        }

        const { name, role } = legacyValidation.data;

        let user = await prisma.user.findFirst({
            where: { name, role: role === 'TEACHER' ? 'TEACHER' : 'STUDENT' },
        });

        if (!user) {
            const hashedPassword = await bcrypt.hash('demo123', 10);
            user = await prisma.user.create({
                data: {
                    name,
                    email: `${name.toLowerCase().replace(/\s/g, '.')}@demo.codinglive`,
                    password: hashedPassword,
                    role: role === 'TEACHER' ? 'TEACHER' : 'STUDENT',
                },
            });
        }

        return NextResponse.json({ user });
    } catch (error: any) {
        console.error('Auth error:', error);
        
        // Provide more specific error messages
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Cet email est déjà utilisé' },
                { status: 400 }
            );
        }
        
        if (error.message?.includes('prisma') || error.message?.includes('database')) {
            return NextResponse.json(
                { error: 'Erreur de base de données. Exécutez: npx prisma generate && npx prisma db push' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur lors de l\'authentification: ' + (error.message || 'Inconnue') },
            { status: 500 }
        );
    }
}
