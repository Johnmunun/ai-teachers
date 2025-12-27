import { openai, INTERACTIVE_SYSTEM_PROMPT } from "@/lib/openai";
import { auth } from "@/auth";
import { z } from "zod";
import {
  buildConversationContext,
  saveConversationMessage,
} from "@/lib/ai-memory";
import { getCachedAIResponse, setCachedAIResponse } from "@/lib/cache";

const InteractRequestSchema = z.object({
  message: z.string().min(1, "Le message ne peut pas être vide"),
  context: z.enum(["revision", "classroom"]).optional(),
  lessonId: z.string().uuid().optional(),
});

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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response("Non autorisé", { status: 401 });
    }

    const body = await req.json();
    const validation = InteractRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Données invalides",
          details: validation.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { message, context, lessonId } = validation.data;
    const userId = (session.user as any).id;

    // Vérifier que la clé API OpenAI est configurée
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuration OpenAI manquante" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Sauvegarder le message utilisateur dans la mémoire
    await saveConversationMessage(
      userId,
      "user",
      message,
      context || "general",
      {
        lessonId,
      }
    );

    // Construire le contexte conversationnel
    const conversationContext = await buildConversationContext(
      userId,
      context || "general",
      10
    );

    // Choose system prompt based on context
    const systemPrompt =
      context === "revision"
        ? REVISION_SYSTEM_PROMPT
        : INTERACTIVE_SYSTEM_PROMPT;

    // Récupérer les informations de l'utilisateur
    let userName = null;
    if (userId && session?.user) {
      userName = (session.user as any).name;
    }

    // Récupérer les cours du module/lesson pour limiter le contexte
    // Optimisé : requête parallèle et limitée pour la vitesse
    let lessonContent = "";

    if (lessonId && userId) {
      try {
        const { prisma } = await import("@/lib/prisma");
        // Optimisation : requête plus légère, seulement les données nécessaires
        const lesson = await prisma.lesson.findFirst({
          where: {
            id: lessonId,
            classroom: {
              studentClassrooms: {
                some: { studentId: userId },
              },
            },
          },
          select: {
            title: true,
            topics: true,
            sessionNotes: {
              select: { content: true },
              orderBy: { createdAt: "desc" },
              take: 5, // Réduit de 10 à 5 pour la vitesse
            },
          },
        });

        if (lesson) {
          lessonContent = `Séance : "${lesson.title || "Sans titre"}"\n`;
          if (lesson.topics && lesson.topics.length > 0) {
            lessonContent += `Sujets abordés : ${(
              lesson.topics as string[]
            ).join(", ")}\n`;
          }
          if (lesson.sessionNotes && lesson.sessionNotes.length > 0) {
            const notes = lesson.sessionNotes.map((n) => n.content).join("\n");
            lessonContent += `Notes de la séance :\n${notes}\n`;
          }
        }
      } catch (error) {
        console.error("Error fetching lesson content:", error);
      }
    }

    // Build context message
    let contextMessage = "";

    if (userName) {
      contextMessage += `L'étudiant s'appelle ${userName}. `;
    }

    if (context === "revision") {
      contextMessage +=
        "Mode révision activé. Tu es Nathalie, professeure assistante IA. ";
    }

    if (lessonId && lessonContent) {
      contextMessage += `\n\nCONTEXTE DU COURS À RÉVISER (IMPORTANT - RESTE UNIQUEMENT DANS CE CONTEXTE) :\n${lessonContent}\n`;
      contextMessage +=
        "IMPORTANT : Ne réponds QUE sur les sujets abordés dans ce cours. Si l'étudiant pose une question hors contexte, redirige-le poliment vers les sujets du cours.";
    } else if (lessonId) {
      contextMessage += `L'étudiant révise une séance spécifique (ID: ${lessonId}). `;
    }

    if (conversationContext) {
      contextMessage += `\n\nHistorique de conversation récent:\n${conversationContext}`;
    }

    // Vérifier le cache
    const cacheKey = `${systemPrompt}:${contextMessage}:${message}`;
    const cachedResponse = await getCachedAIResponse(cacheKey, "interact");

    if (cachedResponse) {
      const result = JSON.parse(cachedResponse);
      await saveConversationMessage(
        userId,
        "assistant",
        result.text,
        context || "general",
        {
          lessonId,
        }
      );

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ ...result, cached: true })}\n\n`
            )
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Générer avec streaming
    // Optimisé pour la vitesse - Utilisation de gpt-4o-mini pour la plupart des cas
    const needsAdvancedModel =
      message.toLowerCase().includes("code") ||
      message.toLowerCase().includes("écris") ||
      message.toLowerCase().includes("génère") ||
      message.toLowerCase().includes("créer");

    const completion = await openai.chat.completions.create({
      model: needsAdvancedModel ? "gpt-4o" : "gpt-4o-mini", // Mini pour la vitesse, 4o pour le code complexe
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${contextMessage}Demande de l'étudiant: ${message}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5, // Réduit pour des réponses plus directes
      max_tokens: 1200, // Réduit pour accélérer
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
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
          await setCachedAIResponse(
            cacheKey,
            JSON.stringify(result),
            "interact",
            3600
          ); // 1h

          // Sauvegarder dans la mémoire
          await saveConversationMessage(
            userId,
            "assistant",
            result.text || fullResponse,
            context || "general",
            { lessonId }
          );

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, result })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI Streaming error:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors du streaming",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
