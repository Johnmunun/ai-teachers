import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';

const SUMMARY_PROMPT = `
Tu es un assistant pédagogique. Génère un récapitulatif de fin de cours basé sur les informations suivantes.

FORMAT JSON OBLIGATOIRE:
{
  "summary": "Résumé général du cours (2-3 paragraphes)",
  "keyPoints": ["Point clé 1", "Point clé 2", ...],
  "conceptsCovered": ["Concept 1", "Concept 2", ...],
  "recommendations": "Recommandations pour la prochaine session",
  "homeworkSuggestions": ["Exercice suggéré 1", "Exercice suggéré 2"]
}

Sois précis, pédagogue et encourageant.
`;

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { lessonId, transcript, topics } = await req.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId requis' }, { status: 400 });
    }

    // Get lesson with quiz data
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        classroom: true,
        quizzes: {
          include: {
            responses: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Calculate quiz stats
    const quizStats = lesson.quizzes.map(quiz => ({
      question: quiz.question,
      totalResponses: quiz.responses.length,
      correctResponses: quiz.responses.filter(r => r.isCorrect).length
    }));

    // Generate AI Summary
    let aiSummary = null;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SUMMARY_PROMPT },
          { 
            role: 'user', 
            content: `
              Cours: ${lesson.classroom.title}
              Session: ${lesson.title}
              Sujets prévus: ${(lesson.topics || []).join(', ')}
              Transcript/Notes: ${transcript || 'Non disponible'}
              
              Quiz donnés:
              ${quizStats.map(q => `- ${q.question}: ${q.correctResponses}/${q.totalResponses} bonnes réponses`).join('\n')}
            `
          }
        ],
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        try {
          aiSummary = JSON.parse(content);
        } catch (parseError) {
          console.error('Erreur de parsing JSON du résumé AI:', parseError);
        }
      }
    } catch (aiError: any) {
      console.error('AI Summary error:', aiError);
      // Continue sans résumé AI si l'API échoue
    }

    // Update lesson with end time and summary
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        endedAt: new Date(),
        summary: aiSummary?.summary || null,
        topics: aiSummary?.conceptsCovered || lesson.topics
      }
    });

    // Create session note with AI summary
    if (aiSummary) {
      await prisma.sessionNote.create({
        data: {
          lessonId,
          content: `
## Récapitulatif de la session

${aiSummary.summary}

### Points clés
${aiSummary.keyPoints?.map((p: string) => `- ${p}`).join('\n')}

### Recommandations
${aiSummary.recommendations}

### Exercices suggérés
${aiSummary.homeworkSuggestions?.map((h: string) => `- ${h}`).join('\n')}
          `,
          aiGenerated: true
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      summary: aiSummary,
      quizStats,
      lesson: updatedLesson
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


