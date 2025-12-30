import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        _count: {
          select: { studentClassrooms: true }
        }
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: classroom.id,
      title: classroom.title,
      description: classroom.description,
      price: classroom.price,
      studentCount: classroom._count.studentClassrooms
    });
  } catch (error) {
    console.error('Error fetching classroom:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


