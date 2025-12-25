import { NextResponse } from 'next/server';
import { openai, INTERACTIVE_SYSTEM_PROMPT, generateSpeech } from '@/lib/openai';
import { z } from 'zod';

const REVISION_SYSTEM_PROMPT = `
Tu es Nathalie, une professeure d'informatique patiente et pédagogue.
Tu aides les étudiants à réviser leurs cours de programmation.

RÈGLES IMPORTANTES :
1. Utilise un langage simple et accessible
2. Donne des exemples concrets et visuels
3. Encourage l'étudiant et sois positif
4. Si l'étudiant demande un quiz, génère une question QCM

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "text": "Ta réponse textuelle (claire et pédagogique)",
  "type": "explanation" | "example" | "quiz",
  "code": {  // OPTIONNEL - pour les exemples de code
    "html": "...",
    "css": "...",
    "js": "..."
  },
  "quizData": {  // OBLIGATOIRE si type === "quiz"
    "question": "La question du quiz",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B"
  },
  "shouldSpeak": false,
  "broadcast": false
}

STYLE DE CODE :
- Si tu génères du code, rends-le clair et bien commenté
- Utilise des noms de variables explicites
- Ajoute des commentaires pour expliquer chaque étape

POUR LES QUIZ :
- Questions claires et précises
- 4 options de réponse
- Une seule bonne réponse
- Évite les questions trop faciles ou trop difficiles
`;

const InteractRequestSchema = z.object({
    message: z.string().min(1, 'Le message ne peut pas être vide'),
    context: z.enum(['revision', 'classroom']).optional(),
    lessonId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = InteractRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { message, context, lessonId } = validation.data;

        // Vérifier que la clé API OpenAI est configurée
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Configuration OpenAI manquante' },
                { status: 500 }
            );
        }

        // Choose system prompt based on context
        const systemPrompt = context === 'revision' 
            ? REVISION_SYSTEM_PROMPT 
            : INTERACTIVE_SYSTEM_PROMPT;

        // Build context message
        let contextMessage = '';
        if (lessonId) {
            contextMessage = `L'étudiant révise une séance spécifique (ID: ${lessonId}). `;
        }
        if (context === 'revision') {
            contextMessage += 'Mode révision activé. Sois pédagogue et encourage l\'étudiant. ';
        }

        // Generate Content
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { 
                    role: 'user', 
                    content: `${contextMessage}Demande de l'étudiant: ${message}` 
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1500,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json(
                { error: 'Aucune réponse générée par l\'IA' },
                { status: 500 }
            );
        }

        let result;
        try {
            result = JSON.parse(content);
        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            return NextResponse.json(
                { error: 'Format de réponse invalide', content },
                { status: 500 }
            );
        }

        // Generate Audio if needed (only for live classroom, not revision)
        let audioBase64 = null;
        if (result.shouldSpeak && result.text && context !== 'revision') {
            try {
                audioBase64 = await generateSpeech(result.text);
            } catch (audioErr) {
                console.error('TTS Error:', audioErr);
                // Continue sans audio si la génération échoue
            }
        }

        return NextResponse.json({ 
            ...result, 
            audio: audioBase64 
        });
    } catch (error: any) {
        console.error('AI Interaction error:', error);
        
        // Gestion spécifique des erreurs OpenAI
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

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return NextResponse.json(
                { error: 'Impossible de se connecter au service OpenAI' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: 'Erreur lors du traitement AI', message: error.message || 'Erreur inconnue' },
            { status: 500 }
        );
    }
}
