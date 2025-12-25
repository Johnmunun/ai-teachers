import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StudentsClient from './StudentsClient';

async function getTeacherStudents(teacherId: string) {
  // Get all classrooms of the teacher
  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    include: {
      studentClassrooms: {
        include: {
          student: {
            include: {
              payments: {
                include: {
                  classroom: true
                }
              },
              quizResponses: true
            }
          }
        }
      },
      lessons: true
    }
  });

  // Flatten and deduplicate students
  const studentsMap = new Map();
  
  classrooms.forEach(classroom => {
    classroom.studentClassrooms.forEach(sc => {
      if (!studentsMap.has(sc.student.id)) {
        studentsMap.set(sc.student.id, {
          ...sc.student,
          classrooms: [],
          totalPaid: 0,
          totalDue: 0,
          quizCount: sc.student.quizResponses.length,
          correctAnswers: sc.student.quizResponses.filter(q => q.isCorrect).length
        });
      }
      
      const studentData = studentsMap.get(sc.student.id);
      studentData.classrooms.push({
        id: classroom.id,
        title: classroom.title,
        joinedAt: sc.joinedAt
      });
      
      // Calculate payments for this classroom
      const payment = sc.student.payments.find(p => p.classroomId === classroom.id);
      if (payment) {
        studentData.totalPaid += payment.paidAmount;
        studentData.totalDue += payment.totalAmount;
      }
    });
  });

  return {
    students: Array.from(studentsMap.values()),
    classrooms: classrooms.map(c => ({ id: c.id, title: c.title, studentCount: c.studentClassrooms.length }))
  };
}

export default async function StudentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role || 'STUDENT';

  if (role !== 'TEACHER') {
    redirect('/dashboard');
  }

  const { students, classrooms } = await getTeacherStudents(userId);

  // Stats
  const totalStudents = students.length;
  const totalRevenue = students.reduce((sum, s) => sum + s.totalPaid, 0);
  const pendingPayments = students.filter(s => s.totalPaid < s.totalDue).length;
  const avgScore = students.length > 0 
    ? Math.round(students.reduce((sum, s) => sum + (s.quizCount > 0 ? (s.correctAnswers / s.quizCount) * 100 : 0), 0) / students.length)
    : 0;

  return (
    <StudentsClient
      students={students}
      classrooms={classrooms}
      stats={{
        totalStudents,
        totalRevenue,
        pendingPayments,
        avgScore
      }}
    />
  );
}


