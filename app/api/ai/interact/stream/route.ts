import { openai, INTERACTIVE_SYSTEM_PROMPT } from '@/lib/openai';
import { auth } from '@/auth';
import { z } from 'zod';
import { buildConversationContext, saveConversationMessage } from '@/lib/ai-memory';
import { getCachedAIResponse, setCachedAIResponse } from '@/lib/cache';

const InteractRequestSchema = z.object({
    message: z.string().min(1, 'Le message ne peut pas être vide'),
    context: z.enum(['revision', 'classroom']).optional(),
    lessonId: z.string().uuid().optional(),
});

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

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Non autorisé', { status: 401 });
        }

        const body = await req.json();
        const validation = InteractRequestSchema.safeParse(body);

        if (!validation.success) {
            return new Response(
                JSON.stringify({ error: 'Données invalides', details: validation.error.issues }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { message, context, lessonId } = validation.data;
        const userId = (session.user as any).id;

        // Vérifier que la clé API OpenAI est configurée
        if (!process.env.OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Configuration OpenAI manquante' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Sauvegarder le message utilisateur dans la mémoire
        await saveConversationMessage(userId, 'user', message, context || 'general', {
            lessonId,
        });

        // Construire le contexte conversationnel
        const conversationContext = await buildConversationContext(
            userId,
            context || 'general',
            10
        );

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
        if (conversationContext) {
            contextMessage += `\n\nHistorique de conversation récent:\n${conversationContext}`;
        }

        // Vérifier le cache
        const cacheKey = `${systemPrompt}:${contextMessage}:${message}`;
        const cachedResponse = await getCachedAIResponse(cacheKey, 'interact');
        
        if (cachedResponse) {
            const result = JSON.parse(cachedResponse);
            await saveConversationMessage(userId, 'assistant', result.text, context || 'general', {
                lessonId,
            });
            
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ...result, cached: true })}\n\n`));
                    controller.close();
                },
            });
            
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        // Générer avec streaming
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
            stream: true,
        });

        const encoder = new TextEncoder();
        let fullResponse = '';

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            fullResponse += content;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                        }
                    }

                    // Parser la réponse complète
                    let result;
                    try {
                        result = JSON.parse(fullResponse);
                    } catch {
                        result = { text: fullResponse };
                    }

                    // Mettre en cache
                    await setCachedAIResponse(cacheKey, JSON.stringify(result), 'interact', 3600); // 1h

                    // Sauvegarder dans la mémoire
                    await saveConversationMessage(
                        userId,
                        'assistant',
                        result.text || fullResponse,
                        context || 'general',
                        { lessonId }
                    );

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('AI Streaming error:', error);
        return new Response(
            JSON.stringify({ error: 'Erreur lors du streaming', message: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

