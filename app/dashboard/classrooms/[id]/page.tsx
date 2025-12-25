import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { formatMoney } from '@/lib/currency';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Play,
  Calendar,
  CreditCard,
  Plus,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  FileText
} from 'lucide-react';
import ClassroomDetailClient from './ClassroomDetailClient';

async function getClassroom(classroomId: string, teacherId: string) {
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId },
    include: {
      studentClassrooms: {
        include: {
          student: {
            include: {
              payments: {
                where: { classroomId }
              }
            }
          }
        }
      },
      lessons: {
        orderBy: { startedAt: 'desc' },
        include: {
          quizzes: true,
          _count: { select: { quizzes: true, sessionNotes: true } }
        }
      }
    }
  });

  return classroom;
}

async function addStudent(formData: FormData) {
  'use server';
  
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    throw new Error('Non autorisé');
  }

  const classroomId = formData.get('classroomId') as string;
  const email = formData.get('email') as string;
  const totalAmount = parseFloat(formData.get('totalAmount') as string) || 0;

  // Find student by email
  const student = await prisma.user.findUnique({ where: { email } });
  if (!student) {
    throw new Error('Étudiant non trouvé');
  }

  // Add to classroom
  await prisma.studentClassroom.create({
    data: {
      studentId: student.id,
      classroomId
    }
  });

  // Create payment record if price is set
  if (totalAmount > 0) {
    await prisma.payment.create({
      data: {
        studentId: student.id,
        classroomId,
        totalAmount,
        paidAmount: 0,
        status: 'PENDING'
      }
    });
  }

  revalidatePath(`/dashboard/classrooms/${classroomId}`);
}

async function removeStudent(formData: FormData) {
  'use server';
  
  const classroomId = formData.get('classroomId') as string;
  const studentId = formData.get('studentId') as string;

  await prisma.studentClassroom.deleteMany({
    where: { classroomId, studentId }
  });

  revalidatePath(`/dashboard/classrooms/${classroomId}`);
}

export default async function ClassroomDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  if ((session.user as any).role !== 'TEACHER') {
    redirect('/dashboard');
  }

  const userId = (session.user as any).id;
  const classroom = await getClassroom(id, userId);

  if (!classroom) {
    notFound();
  }

  return (
    <ClassroomDetailClient 
      classroom={classroom}
      addStudentAction={addStudent}
      removeStudentAction={removeStudent}
    />
  );
}


