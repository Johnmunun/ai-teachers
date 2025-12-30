import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';
import { z } from 'zod';

const FeedbackRequestSchema = z.object({
    code: z.string().optional(),
    answer: z.string().optional(),
    question: z.string().min(1, 'Question ou code requis'),
    language: z.string().optional(),
    correctAnswer: z.string().optional(),
    context: z.string().optional(),
});

const FEEDBACK_PROMPT = `
Tu es un professeur expert qui donne des feedbacks constructifs et pédagogiques.

Analyse la réponse de l'étudiant et génère un feedback détaillé.

Format JSON:
{
  "isCorrect": true|false,
  "score": 0.0-1.0, // Score de la réponse
  "feedback": "Feedback textuel détaillé",
  "strengths": ["Point positif 1", "Point positif 2"],
  "improvements": ["Point à améliorer 1", "Point à améliorer 2"],
  "hints": ["Indice 1", "Indice 2"], // Si incorrect
  "explanation": "Explication détaillée de la réponse correcte",
  "codeSuggestions": { // Si c'est du code
    "improvedCode": "Code amélioré",
    "comments": "Commentaires sur les améliorations"
  },
  "nextSteps": ["Étape suivante 1", "Étape suivante 2"]
}

Sois encourageant, constructif et pédagogique. Même si la réponse est incorrecte, trouve des points positifs.
`;

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const validation = FeedbackRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { code, answer, question, language, correctAnswer, context } = validation.data;

        // Vérifier que la clé API OpenAI est configurée
        if (!process.env.OPENAI_API_KEY) {
            // Feedback basique sans IA
            const isCorrect = correctAnswer ? answer === correctAnswer : false;
            return NextResponse.json({
                isCorrect,
                score: isCorrect ? 1.0 : 0.0,
                feedback: isCorrect
                    ? 'Bonne réponse !'
                    : 'Réponse incorrecte. Réessayez !',
                strengths: [],
                improvements: [],
                hints: [],
                explanation: correctAnswer ? `La réponse correcte est: ${correctAnswer}` : '',
                nextSteps: [],
            });
        }

        // Construire le prompt
        let userPrompt = `Question: ${question}\n\n`;
        
        if (code) {
            userPrompt += `Code soumis:\n\`\`\`${language || 'javascript'}\n${code}\n\`\`\`\n\n`;
        } else if (answer) {
            userPrompt += `Réponse de l'étudiant: ${answer}\n\n`;
        }

        if (correctAnswer) {
            userPrompt += `Réponse correcte attendue: ${correctAnswer}\n\n`;
        }

        if (context) {
            userPrompt += `Contexte: ${context}\n\n`;
        }

        userPrompt += 'Génère un feedback détaillé et pédagogique.';

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: FEEDBACK_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json({ error: 'Erreur lors de la génération du feedback' }, { status: 500 });
        }

        let feedback;
        try {
            feedback = JSON.parse(content);
        } catch {
            // Si le parsing échoue, créer un feedback basique
            const isCorrect = correctAnswer ? answer === correctAnswer : false;
            feedback = {
                isCorrect,
                score: isCorrect ? 1.0 : 0.0,
                feedback: content,
                strengths: [],
                improvements: [],
                hints: [],
                explanation: correctAnswer || '',
                nextSteps: [],
            };
        }

        return NextResponse.json(feedback);
    } catch (error: any) {
        console.error('Feedback error:', error);
        
        // Gestion spécifique des erreurs OpenAI
        if (error.status === 429) {
            return NextResponse.json(
                { error: 'Limite de requêtes dépassée. Réessayez plus tard.' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur lors de la génération du feedback', message: error.message },
            { status: 500 }
        );
    }
}

