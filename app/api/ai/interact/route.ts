import { NextResponse } from 'next/server';
import { openai, INTERACTIVE_SYSTEM_PROMPT, generateSpeech } from '@/lib/openai';
import { z } from 'zod';
import { auth } from '@/auth';
import { buildConversationContext, saveConversationMessage } from '@/lib/ai-memory';
import { getCachedAIResponse, setCachedAIResponse } from '@/lib/cache';

const REVISION_SYSTEM_PROMPT = `
Tu es Nathalie (ou Nath), une professeure d'informatique experte, professionnelle et bienveillante.
Tu es l'assistante pédagogique IA qui aide les étudiants à réviser leurs cours de programmation.

TON IDENTITÉ :
- Nom : Nathalie (ou Nath pour les intimes)
- Rôle : Professeure assistante IA spécialisée en programmation
- Ton : Professionnel, pédagogue, encourageant, clair et bienveillant
- Tu connais parfaitement ton rôle et tu es fière d'aider les étudiants

RÈGLES DE CONTEXTE :
1. TU RÉPONDS À TOUTES LES QUESTIONS LIÉES À LA PROGRAMMATION, AUX FRAMEWORKS, BIBLIOTHÈQUES, OUTILS DE DÉVELOPPEMENT ET AUX COURS DU MODULE
2. ACCEPTE les questions sur :
   - Langages de programmation (JavaScript, Python, HTML, CSS, etc.)
   - Frameworks et bibliothèques (React, Vue, Angular, Bootstrap, Tailwind, etc.)
   - Outils de développement (Git, npm, webpack, etc.)
   - Concepts informatiques (algorithme, structure de données, etc.)
   - Histoire et contexte des technologies (qui a créé, quand, pourquoi)
   - Bonnes pratiques et méthodologies
3. REFUSE UNIQUEMENT les questions complètement hors sujet (sport, cuisine, actualité non-technique, etc.)
4. EXCEPTION : Un simple "bonjour", "salut", "merci", "au revoir" est accepté - réponds brièvement et professionnellement

RÈGLES PÉDAGOGIQUES :
1. Utilise un langage professionnel mais accessible
2. Donne des exemples concrets et visuels avec du code
3. Encourage l'étudiant et sois positif
4. Si l'étudiant demande un quiz, génère une question QCM sur les concepts du module
5. Utilise le prénom de l'étudiant quand tu le connais (il sera fourni dans le contexte)

CAPACITÉS DE CODE :
- Tu es experte en HTML, CSS, JavaScript et programmation web
- Tu peux écrire du code complet, fonctionnel et bien commenté
- Le code doit être clair, avec des noms de variables explicites
- Ajoute toujours des commentaires pédagogiques

FORMAT DE RÉPONSE JSON OBLIGATOIRE :
{
  "text": "Ta réponse textuelle (professionnelle et pédagogique)",
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
- Code complet et fonctionnel
- Commentaires pédagogiques explicatifs
- Noms de variables explicites
- Structure claire et lisible

POUR LES QUIZ :
- Questions sur les concepts du module uniquement
- 4 options de réponse
- Une seule bonne réponse
- Niveau adapté au module
`;

const InteractRequestSchema = z.object({
    message: z.string().min(1, 'Le message ne peut pas être vide'),
    context: z.enum(['revision', 'classroom']).optional(),
    lessonId: z.string().uuid().optional(),
    forceAudio: z.boolean().optional(), // Force l'audio pour le prof
    forceBroadcast: z.boolean().optional(), // Force le broadcast pour le prof
    generateAudioOnly: z.boolean().optional(), // Génère seulement l'audio
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

        const { message, context, lessonId, forceAudio, forceBroadcast, generateAudioOnly } = validation.data;

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

        // Récupérer les informations de l'utilisateur
        let userName = null;
        let userEmail = null;
        if (userId && session?.user) {
            userName = (session.user as any).name;
            userEmail = (session.user as any).email;
        }

        // Récupérer les cours du module/lesson pour limiter le contexte
        let lessonContent = '';
        let moduleCourses: any[] = [];
        
        if (lessonId && userId) {
            try {
                const { prisma } = await import('@/lib/prisma');
                const lesson = await prisma.lesson.findUnique({
                    where: { id: lessonId },
                    include: {
                        classroom: {
                            include: {
                                studentClassrooms: {
                                    where: { studentId: userId }
                                }
                            }
                        },
                        sessionNotes: {
                            orderBy: { createdAt: 'asc' },
                            take: 10
                        }
                    }
                });

                if (lesson && lesson.classroom.studentClassrooms.length > 0) {
                    lessonContent = `Séance : "${lesson.title || 'Sans titre'}"\n`;
                    if (lesson.topics && lesson.topics.length > 0) {
                        lessonContent += `Sujets abordés : ${(lesson.topics as string[]).join(', ')}\n`;
                    }
                    if (lesson.sessionNotes && lesson.sessionNotes.length > 0) {
                        const notes = lesson.sessionNotes.map(n => n.content).join('\n');
                        lessonContent += `Notes de la séance :\n${notes}\n`;
                    }
                }
            } catch (error) {
                console.error('Error fetching lesson content:', error);
            }
        }

        // Build context message
        let contextMessage = '';
        
        if (userName) {
            contextMessage += `L'étudiant s'appelle ${userName}. `;
        }
        
        if (context === 'revision') {
            contextMessage += 'Mode révision activé. Tu es Nathalie, professeure assistante IA. ';
        }
        
        if (lessonId && lessonContent) {
            contextMessage += `\n\nCONTEXTE DU COURS À RÉVISER (IMPORTANT - RESTE UNIQUEMENT DANS CE CONTEXTE) :\n${lessonContent}\n`;
            contextMessage += 'IMPORTANT : Ne réponds QUE sur les sujets abordés dans ce cours. Si l\'étudiant pose une question hors contexte, redirige-le poliment vers les sujets du cours.';
        } else if (lessonId) {
            contextMessage += `L'étudiant révise une séance spécifique (ID: ${lessonId}). `;
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

        // Generate Content - Optimisé pour la vitesse
        // Utilisation de gpt-4o-mini pour les réponses rapides (3-5x plus rapide que gpt-4o)
        // Pour les questions complexes nécessitant du code, on peut utiliser gpt-4o
        const needsAdvancedModel = message.toLowerCase().includes('code') || 
                                   message.toLowerCase().includes('écris') ||
                                   message.toLowerCase().includes('génère') ||
                                   message.toLowerCase().includes('créer');
        
        const completion = await openai.chat.completions.create({
            model: needsAdvancedModel ? 'gpt-4o' : 'gpt-4o-mini', // Mini pour la vitesse, 4o pour le code complexe
            messages: [
                { role: 'system', content: systemPrompt },
                { 
                    role: 'user', 
                    content: `${contextMessage}Demande de l'étudiant: ${message}` 
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.5, // Réduit de 0.7 à 0.5 pour des réponses plus directes et rapides
            max_tokens: 1200, // Réduit de 1500 à 1200 pour accélérer
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

        // Generate Audio - TOUJOURS pour le prof en mode classroom
        let audioBase64 = null;
        const shouldGenerateAudio = forceAudio || 
                                   (result.shouldSpeak && result.text && context !== 'revision') ||
                                   (context === 'classroom' && forceAudio !== false);
        
        if (shouldGenerateAudio && result.text && !generateAudioOnly) {
            try {
                audioBase64 = await generateSpeech(result.text);
            } catch (audioErr) {
                console.error('TTS Error:', audioErr);
                // Continue sans audio si la génération échoue
            }
        }

        // Si generateAudioOnly, retourner seulement l'audio
        if (generateAudioOnly && result.text) {
            try {
                audioBase64 = await generateSpeech(result.text);
                return NextResponse.json({ audio: audioBase64 });
            } catch (audioErr) {
                console.error('TTS Error:', audioErr);
                return NextResponse.json({ error: 'Erreur génération audio' }, { status: 500 });
            }
        }

        // Forcer broadcast pour le prof
        if (forceBroadcast) {
            result.broadcast = true;
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
