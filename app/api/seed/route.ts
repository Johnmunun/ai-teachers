import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * API pour créer l'admin/enseignant par défaut
 * 
 * Option 1: Via .env (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
 * Option 2: Directement dans la requête POST
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secret, email, password, name } = body;
    
    // Vérifier le secret pour sécuriser cette route
    if (secret !== process.env.SEED_SECRET && secret !== 'init') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Priorité: données de la requête > variables .env
    const adminEmail = email || process.env.ADMIN_EMAIL;
    const adminPassword = password || process.env.ADMIN_PASSWORD;
    const adminName = name || process.env.ADMIN_NAME || 'Administrateur';

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({
        error: 'Email et mot de passe requis. Envoyez { "secret": "init", "email": "...", "password": "...", "name": "..." }',
        created: false
      }, { status: 400 });
    }

    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      // Si c'est un étudiant, le promouvoir en enseignant
      if (existingAdmin.role === 'STUDENT') {
        const updated = await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'TEACHER' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });
        return NextResponse.json({
          message: 'Utilisateur promu en enseignant !',
          admin: updated,
          promoted: true
        });
      }
      
      return NextResponse.json({
        message: 'L\'administrateur existe déjà',
        admin: {
          id: existingAdmin.id,
          name: existingAdmin.name,
          email: existingAdmin.email,
          role: existingAdmin.role
        },
        created: false
      });
    }

    // Créer l'admin
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'TEACHER'
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
      message: 'Administrateur créé avec succès !',
      admin,
      created: true
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'admin' },
      { status: 500 }
    );
  }
}

// GET pour vérifier l'état
export async function GET() {
  try {
    // Compter les enseignants
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    const students = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    return NextResponse.json({
      teachers,
      teacherCount: teachers.length,
      studentCount: students
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur de connexion à la base de données' },
      { status: 500 }
    );
  }
}
