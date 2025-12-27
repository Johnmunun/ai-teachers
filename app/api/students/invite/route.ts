import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

// POST - Inviter/créer un étudiant et l'inscrire à un cours
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const teacherId = (session.user as any).id;
    const { email, name, classroomId, phone } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'email et name requis' }, { status: 400 });
    }

    // Vérifier que le cours appartient à l'enseignant
    if (classroomId) {
      const classroom = await prisma.classroom.findFirst({
        where: { id: classroomId, teacherId }
      });

      if (!classroom) {
        return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 });
      }
    }

    // Chercher si l'étudiant existe déjà
    let student = await prisma.user.findUnique({
      where: { email }
    });

    let isNewStudent = false;
    let temporaryPassword = null;

    if (!student) {
      // Créer un nouvel étudiant avec un mot de passe temporaire
      temporaryPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      student = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          password: hashedPassword,
          role: 'STUDENT'
        }
      });

      isNewStudent = true;
    }

    // Si un cours est spécifié, inscrire l'étudiant
    let enrollment = null;
    let payment = null;

    if (classroomId) {
      // Vérifier si déjà inscrit
      const existingEnrollment = await prisma.studentClassroom.findUnique({
        where: {
          studentId_classroomId: { studentId: student.id, classroomId }
        }
      });

      if (!existingEnrollment) {
        enrollment = await prisma.studentClassroom.create({
          data: {
            studentId: student.id,
            classroomId
          }
        });

        // Créer le paiement si le cours a un prix
        const classroom = await prisma.classroom.findUnique({
          where: { id: classroomId }
        });

        if (classroom && classroom.price > 0) {
          payment = await prisma.payment.create({
            data: {
              studentId: student.id,
              classroomId,
              totalAmount: classroom.price
            }
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email
      },
      isNewStudent,
      temporaryPassword, // À envoyer par email dans un vrai système
      enrollment: enrollment ? true : false,
      payment: payment ? true : false,
      message: isNewStudent 
        ? `Étudiant créé avec le mot de passe temporaire: ${temporaryPassword}`
        : 'Étudiant existant ajouté au cours'
    });
  } catch (error) {
    console.error('Error inviting student:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Rechercher des étudiants par email
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let searchParams = new URLSearchParams();
    try {
      if (req.url) {
        const url = new URL(req.url);
        searchParams = url.searchParams;
      }
    } catch (error) {
      console.warn('Failed to parse URL from request:', error);
    }
    const email = searchParams.get('email');
    const query = searchParams.get('q');

    if (!email && !query) {
      return NextResponse.json({ error: 'email ou q requis' }, { status: 400 });
    }

    // Construire les conditions OR explicitement
    const orConditions: Array<{ email?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' } }> = [];
    
    if (email) {
      orConditions.push({ email: { contains: email, mode: 'insensitive' } });
    }
    
    if (query) {
      orConditions.push({ name: { contains: query, mode: 'insensitive' } });
      orConditions.push({ email: { contains: query, mode: 'insensitive' } });
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: orConditions
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      take: 10
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error searching students:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

