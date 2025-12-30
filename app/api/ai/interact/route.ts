import { NextResponse } from 'next/server';
import { openai, INTERACTIVE_SYSTEM_PROMPT, generateSpeech } from '@/lib/openai';
import { z } from 'zod';
import { auth } from '@/auth';
import { buildConversationContext, saveConversationMessage } from '@/lib/ai-memory';
import { getCachedAIResponse, setCachedAIResponse } from '@/lib/cache';

const REVISION_SYSTEM_PROMPT = `Tu es Nathalie, une professeure d'informatique patiente et pédagogue. Tu aides les étudiants à réviser leurs cours de programmation.

RÈGLES IMPORTANTES :
1. Utilise un langage simple et accessible
2. Donne des exemples concrets et visuels
3. Encourage l'étudiant et sois positif
4. Réponds TOUJOURS en JSON valide, même pour les salutations simples
5. Si l'étudiant demande un quiz, génère une question QCM

CRITIQUE : Tu DOIS répondre UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou après le JSON.

FORMAT DE RÉPONSE JSON OBLIGATOIRE (réponds TOUJOURS dans ce format) :
{
  "text": "Ta réponse textuelle (claire et pédagogique). Réponds toujours, même pour 'bonjour' ou des questions simples.",
  "type": "explanation",
  "shouldSpeak": true,
  "broadcast": false
}

Si l'étudiant demande un quiz, utilise :
{
  "text": "Voici un quiz pour tester tes connaissances !",
  "type": "quiz",
  "quizData": {
    "question": "La question du quiz",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B"
  },
  "shouldSpeak": true,
  "broadcast": false
}

Si l'étudiant demande un exemple de code, utilise :
{
  "text": "Voici un exemple de code pour t'aider à comprendre :",
  "type": "example",
  "code": {
    "js": "// Exemple de code\nconst exemple = 'code ici';"
  },
  "shouldSpeak": true,
  "broadcast": false
}

EXEMPLES DE RÉPONSES :
- Pour "bonjour" : {"text": "Bonjour ! Je suis Nathalie, ton assistante pédagogique. 👋 Comment puis-je t'aider aujourd'hui ?", "type": "explanation", "shouldSpeak": true, "broadcast": false}
- Pour "Explique-moi les boucles" : {"text": "Les boucles en JavaScript permettent de répéter une action plusieurs fois. Il existe plusieurs types : for, while, do-while, et forEach pour les tableaux. Voici un exemple simple :", "type": "example", "code": {"js": "// Boucle for\nfor (let i = 0; i < 5; i++) {\n  console.log('Numéro:', i);\n}"}, "shouldSpeak": true, "broadcast": false}

RAPPEL : Réponds TOUJOURS en JSON valide, sans texte avant ou après.`;

const InteractRequestSchema = z.object({
    message: z.string().min(1, 'Le message ne peut pas être vide'),
    context: z.enum(['revision', 'classroom', 'student_assistance']).optional(),
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

        // Récupérer l'utilisateur pour la mémoire
        const session = await auth();
        const userId = session?.user ? (session.user as any).id : null;

        // Sauvegarder le message utilisateur dans la mémoire
        if (userId) {
            await saveConversationMessage(userId, 'user', message, context || 'general', {
                lessonId,
            });
        }

        // Vérifier que la clé API OpenAI est configurée
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Configuration OpenAI manquante' },
                { status: 500 }
            );
        }

        // Construire le contexte conversationnel
        const conversationContext = userId 
            ? await buildConversationContext(userId, context || 'general', 10)
            : '';

        // Choose system prompt based on context
        const systemPrompt = context === 'revision' 
            ? REVISION_SYSTEM_PROMPT 
            : INTERACTIVE_SYSTEM_PROMPT;

        // Build context message
        let contextMessage = '';
        if (lessonId) {
            if (context === 'revision') {
                contextMessage = `L'étudiant révise une séance spécifique (ID: ${lessonId}). `;
            } else {
                contextMessage = `L'étudiant suit un cours en direct (ID: ${lessonId}). `;
            }
        }
        if (context === 'revision') {
            contextMessage += 'Mode révision activé. Sois pédagogue et encourage l\'étudiant. ';
        } else if (context === 'student_assistance') {
            contextMessage += 'Tu assistes un étudiant pendant un cours en direct. Réponds de manière claire, concise et encourageante. Explique, reformule, donne des exemples concrets. ';
        }
        if (conversationContext) {
            contextMessage += `\n\nHistorique de conversation récent:\n${conversationContext}`;
        }

        // Vérifier le cache
        const cacheKey = `${systemPrompt}:${contextMessage}:${message}`;
        const cachedResponse = await getCachedAIResponse(cacheKey, 'interact');
        
        if (cachedResponse) {
            try {
                const result = JSON.parse(cachedResponse);
                if (userId) {
                    await saveConversationMessage(
                        userId,
                        'assistant',
                        result.text || '',
                        context || 'general',
                        { lessonId }
                    );
                }
                return NextResponse.json({ ...result, cached: true });
            } catch {
                // Si le cache est corrompu, continuer avec l'appel API
            }
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
            // Nettoyer le contenu pour extraire le JSON (enlever markdown code blocks si présents)
            let cleanedContent = content.trim();
            if (cleanedContent.startsWith('```json')) {
                cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedContent.startsWith('```')) {
                cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            result = JSON.parse(cleanedContent);
            
            // Vérifier que le résultat a au moins un champ "text"
            if (!result.text) {
                // Si pas de texte, utiliser le contenu brut ou créer une réponse par défaut
                result = {
                    text: cleanedContent || "Je suis là pour t'aider ! Peux-tu reformuler ta question ?",
                    type: 'explanation',
                    shouldSpeak: false,
                    broadcast: false
                };
            }
        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            console.error('Contenu reçu:', content);
            
            // En cas d'erreur de parsing, essayer d'extraire le texte ou utiliser le contenu brut
            // Extraire le texte entre accolades si possible
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    result = JSON.parse(jsonMatch[0]);
                } catch {
                    // Si ça échoue encore, créer une réponse par défaut avec le contenu
                    result = {
                        text: content || "Je suis là pour t'aider ! Peux-tu reformuler ta question ?",
                        type: 'explanation',
                        shouldSpeak: false,
                        broadcast: false
                    };
                }
            } else {
                // Pas de JSON trouvé, utiliser le contenu brut comme texte
                result = {
                    text: content || "Je suis là pour t'aider ! Peux-tu reformuler ta question ?",
                    type: 'explanation',
                    shouldSpeak: false,
                    broadcast: false
                };
            }
        }

        // Mettre en cache la réponse (1h pour les interactions)
        await setCachedAIResponse(cacheKey, content, 'interact', 3600);

        // Sauvegarder dans la mémoire
        if (userId) {
            await saveConversationMessage(
                userId,
                'assistant',
                result.text || content,
                context || 'general',
                { lessonId }
            );
        }

        // Generate Audio if needed (for all contexts: classroom, revision, student_assistance)
        let audioBase64 = null;
        if (result.shouldSpeak && result.text) {
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
