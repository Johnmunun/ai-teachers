import { NextResponse } from 'next/server';
import { openai, SYSTEM_PROMPT } from '@/lib/openai';
import { z } from 'zod';
import { getCachedAIResponse, setCachedAIResponse } from '@/lib/cache';

const AnalyzeRequestSchema = z.object({
    transcript: z.string().min(1, 'Le transcript ne peut pas être vide'),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = AnalyzeRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { transcript } = validation.data;

        // Vérifier que la clé API OpenAI est configurée
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Configuration OpenAI manquante' },
                { status: 500 }
            );
        }

        // Vérifier le cache d'abord
        const cacheKey = `${SYSTEM_PROMPT}:${transcript}`;
        const cachedResponse = await getCachedAIResponse(cacheKey, 'analyze');
        
        if (cachedResponse) {
            try {
                const result = JSON.parse(cachedResponse);
                return NextResponse.json({ ...result, cached: true });
            } catch {
                // Si le cache est corrompu, continuer avec l'appel API
            }
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: transcript },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            return NextResponse.json(
                { error: 'Aucune réponse générée par l\'IA' },
                { status: 500 }
            );
        }

        try {
            const result = JSON.parse(content);
            
            // Mettre en cache la réponse (24h)
            await setCachedAIResponse(cacheKey, content, 'analyze', 86400);
            
            return NextResponse.json(result);
        } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            return NextResponse.json(
                { error: 'Format de réponse invalide', content },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('AI error:', error);
        
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
            { error: 'Erreur lors de l\'analyse AI', message: error.message || 'Erreur inconnue' },
            { status: 500 }
        );
    }
}
