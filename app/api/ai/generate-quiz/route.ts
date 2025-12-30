import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const GenerateQuizSchema = z.object({
    lessonId: z.string().uuid('ID de leçon invalide'),
    transcript: z.string().min(10, 'Le transcript doit contenir au moins 10 caractères'),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
    questionType: z.enum(['multiple_choice', 'true_false', 'open']).optional().default('multiple_choice'),
});

const QUIZ_GENERATION_PROMPT = `
Tu es un expert en création de quiz pédagogiques.
Ton rôle est de générer des questions de quiz adaptées au niveau de l'étudiant à partir du contenu d'un cours.

RÈGLES STRICTES :
1. Génère UNE question pertinente basée sur le contenu fourni
2. Adapte la difficulté selon le niveau demandé (easy, medium, hard)
3. Pour "multiple_choice" : 4 options, une seule correcte, les autres plausibles mais incorrectes
4. Pour "true_false" : question claire avec réponse vraie ou fausse
5. Pour "open" : question ouverte qui nécessite une réponse rédigée
6. La question doit tester la compréhension, pas juste la mémorisation
7. Utilise le français

Format de réponse JSON OBLIGATOIRE :
{
  "question": "La question du quiz",
  "type": "multiple_choice" | "true_false" | "open",
  "options": ["option1", "option2", "option3", "option4"], // Pour multiple_choice uniquement
  "correctAnswer": "la réponse correcte",
  "explanation": "Explication courte de la réponse (pour le feedback)",
  "difficulty": "easy" | "medium" | "hard"
}

Pour "true_false" : options = ["Vrai", "Faux"], correctAnswer = "Vrai" ou "Faux"
Pour "open" : options = [], correctAnswer = "Réponse attendue (pour référence)"

Retourne UNIQUEMENT le JSON, sans texte supplémentaire.
`;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validation = GenerateQuizSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { lessonId, transcript, difficulty, questionType } = validation.data;

        // Vérifier que la leçon existe
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            return NextResponse.json(
                { error: 'Leçon non trouvée' },
                { status: 404 }
            );
        }

        // Vérifier que la clé API OpenAI est configurée
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Configuration OpenAI manquante' },
                { status: 500 }
            );
        }

        // Générer le quiz avec l'IA
        const prompt = `Contenu du cours à partir duquel générer un quiz :
${transcript}

Niveau de difficulté demandé : ${difficulty}
Type de question demandé : ${questionType}

Génère un quiz adapté.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: QUIZ_GENERATION_PROMPT },
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 500,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json(
                { error: 'Aucune réponse générée par l\'IA' },
                { status: 500 }
            );
        }

        try {
            const quizData = JSON.parse(content);

            // Valider les données du quiz
            if (!quizData.question || !quizData.correctAnswer) {
                return NextResponse.json(
                    { error: 'Format de quiz invalide généré par l\'IA' },
                    { status: 500 }
                );
            }

            // Pour true/false, s'assurer que les options sont correctes
            if (questionType === 'true_false') {
                quizData.options = ['Vrai', 'Faux'];
            }

            // Pour open, pas d'options
            if (questionType === 'open') {
                quizData.options = [];
            }

            // Créer le quiz dans la base de données
            const quiz = await prisma.quiz.create({
                data: {
                    lessonId,
                    question: quizData.question,
                    options: quizData.options || [],
                    correctAnswer: quizData.correctAnswer,
                },
            });

            return NextResponse.json({
                quiz: {
                    id: quiz.id,
                    question: quiz.question,
                    options: quiz.options,
                    correctAnswer: quiz.correctAnswer,
                    type: quizData.type || questionType,
                    explanation: quizData.explanation || '',
                    difficulty: quizData.difficulty || difficulty,
                },
            });
        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            return NextResponse.json(
                { error: 'Format de réponse invalide', content },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Erreur génération quiz:', error);

        if (error.status === 401 || error.status === 403) {
            return NextResponse.json(
                { error: 'Clé API OpenAI invalide ou expirée' },
                { status: 401 }
            );
        }

        if (error.status === 429) {
            return NextResponse.json(
                { error: 'Limite de requêtes OpenAI dépassée. Réessayez plus tard.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur lors de la génération du quiz', message: error.message || 'Erreur inconnue' },
            { status: 500 }
        );
    }
}

