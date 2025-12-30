import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get('classroomId');
    const studentId = searchParams.get('studentId');

    if (!classroomId || !studentId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get student and classroom data
    const [student, classroom] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId } }),
      prisma.classroom.findUnique({
        where: { id: classroomId },
        include: {
          teacher: true,
          lessons: {
            include: {
              quizzes: {
                include: {
                  responses: {
                    where: { studentId }
                  }
                }
              }
            },
            orderBy: { startedAt: 'asc' }
          }
        }
      })
    ]);

    if (!student || !classroom) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    // Calculate grades per session
    const sessionGrades = classroom.lessons.map(lesson => {
      const quizResults = lesson.quizzes.map(quiz => ({
        question: quiz.question,
        response: quiz.responses[0],
        isCorrect: quiz.responses[0]?.isCorrect || false
      }));

      const correct = quizResults.filter(q => q.isCorrect).length;
      const total = quizResults.length;
      const score = total > 0 ? (correct / total) * 20 : 0;

      return {
        title: lesson.title || `Session du ${new Date(lesson.startedAt).toLocaleDateString('fr-FR')}`,
        date: new Date(lesson.startedAt).toLocaleDateString('fr-FR'),
        topics: lesson.topics || [],
        quizzes: quizResults,
        correct,
        total,
        score: score.toFixed(1)
      };
    });

    // Overall stats
    const totalQuizzes = sessionGrades.reduce((sum, s) => sum + s.total, 0);
    const totalCorrect = sessionGrades.reduce((sum, s) => sum + s.correct, 0);
    const overallPercentage = totalQuizzes > 0 ? (totalCorrect / totalQuizzes) * 100 : 0;
    const overallGrade = (overallPercentage / 100) * 20;
    
    const mention = overallGrade >= 16 ? 'Très Bien' :
                   overallGrade >= 14 ? 'Bien' :
                   overallGrade >= 12 ? 'Assez Bien' :
                   overallGrade >= 10 ? 'Passable' : 'Insuffisant';

    // Generate HTML bulletin
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin de Notes - ${student.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      min-height: 100vh;
      padding: 40px;
      color: #e2e8f0;
    }
    .bulletin {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(6, 182, 212, 0.3);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      font-weight: bold;
      color: white;
      margin-bottom: 10px;
    }
    .header p {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .logo span:first-child { color: #06b6d4; }
    .logo span:last-child { color: white; }
    .content { padding: 40px; }
    .student-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .student-info div { }
    .student-info label { color: #94a3b8; font-size: 12px; text-transform: uppercase; }
    .student-info p { color: white; font-size: 16px; font-weight: 500; margin-top: 5px; }
    .grade-summary {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .grade-box {
      flex: 1;
      text-align: center;
      padding: 25px;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .grade-box.main {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
      border-color: rgba(6, 182, 212, 0.3);
    }
    .grade-box h3 { color: #94a3b8; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; }
    .grade-box .value { font-size: 36px; font-weight: bold; color: white; }
    .grade-box .value.main { color: #06b6d4; }
    .grade-box .mention { 
      display: inline-block;
      margin-top: 10px;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    .mention.excellent { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .mention.good { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }
    .mention.average { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .mention.poor { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .sessions { margin-top: 30px; }
    .sessions h2 { 
      color: white; 
      font-size: 18px; 
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .session {
      margin-bottom: 20px;
      padding: 20px;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .session-title { color: white; font-weight: 500; }
    .session-date { color: #64748b; font-size: 14px; }
    .session-score { 
      font-size: 20px; 
      font-weight: bold; 
      color: #06b6d4;
    }
    .quiz-list { margin-top: 10px; }
    .quiz-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
    }
    .quiz-item:last-child { border-bottom: none; }
    .quiz-icon { width: 20px; height: 20px; }
    .quiz-icon.correct { color: #10b981; }
    .quiz-icon.wrong { color: #ef4444; }
    .quiz-question { color: #cbd5e1; }
    .footer {
      padding: 30px 40px;
      background: rgba(0,0,0,0.3);
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { background: white; padding: 0; }
      .bulletin { box-shadow: none; border: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="bulletin">
    <div class="header">
      <div class="logo"><span>Coding</span><span>Live</span></div>
      <h1>Bulletin de Notes</h1>
      <p>${classroom.title}</p>
    </div>
    
    <div class="content">
      <div class="student-info">
        <div>
          <label>Étudiant</label>
          <p>${student.name}</p>
        </div>
        <div>
          <label>Email</label>
          <p>${student.email}</p>
        </div>
        <div>
          <label>Enseignant</label>
          <p>${classroom.teacher.name}</p>
        </div>
        <div>
          <label>Date</label>
          <p>${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <div class="grade-summary">
        <div class="grade-box main">
          <h3>Note Finale</h3>
          <div class="value main">${overallGrade.toFixed(1)}/20</div>
          <div class="mention ${overallGrade >= 14 ? 'excellent' : overallGrade >= 10 ? 'good' : 'poor'}">
            ${mention}
          </div>
        </div>
        <div class="grade-box">
          <h3>Quiz Réussis</h3>
          <div class="value">${totalCorrect}/${totalQuizzes}</div>
        </div>
        <div class="grade-box">
          <h3>Taux de Réussite</h3>
          <div class="value">${overallPercentage.toFixed(0)}%</div>
        </div>
        <div class="grade-box">
          <h3>Sessions Suivies</h3>
          <div class="value">${sessionGrades.length}</div>
        </div>
      </div>

      <div class="sessions">
        <h2>Détail par Session</h2>
        ${sessionGrades.map(session => `
          <div class="session">
            <div class="session-header">
              <div>
                <div class="session-title">${session.title}</div>
                <div class="session-date">${session.date}</div>
              </div>
              <div class="session-score">${session.score}/20</div>
            </div>
            ${session.quizzes.length > 0 ? `
              <div class="quiz-list">
                ${session.quizzes.map(quiz => `
                  <div class="quiz-item">
                    <span class="quiz-icon ${quiz.isCorrect ? 'correct' : 'wrong'}">
                      ${quiz.isCorrect ? '✓' : '✗'}
                    </span>
                    <span class="quiz-question">${quiz.question}</span>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: #64748b; font-size: 14px;">Aucun quiz pour cette session</p>'}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="footer">
      <p>Ce bulletin a été généré automatiquement par CodingLive</p>
      <p>© ${new Date().getFullYear()} CodingLive - Plateforme d'enseignement assistée par IA</p>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="bulletin-${student.name.replace(/\s/g, '-')}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating bulletin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


