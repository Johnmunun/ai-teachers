import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { z } from 'zod';

const ImproveTranscriptSchema = z.object({
    transcript: z.string().min(1, 'Le transcript ne peut pas être vide'),
});

const IMPROVE_TRANSCRIPT_PROMPT = `
Tu es un expert en correction et amélioration de transcriptions vocales.
Ton rôle est de corriger et améliorer une transcription générée par la reconnaissance vocale native du navigateur.

RÈGLES STRICTES :
1. Corrige UNIQUEMENT les erreurs évidentes de transcription (mots mal transcrits, fautes de frappe)
2. Garde EXACTEMENT le sens et le contenu de ce qui a été dit
3. Ne change PAS le style de parole (garde les hésitations, répétitions naturelles si elles sont pertinentes)
4. Corrige la ponctuation et la capitalisation pour améliorer la lisibilité
5. Ne supprime PAS de contenu, ne réécris PAS les phrases
6. Si la transcription semble correcte, retourne-la telle quelle

Format de réponse JSON :
{
  "improved": "transcription corrigée et améliorée",
  "confidence": "high" | "medium" | "low" (confiance dans la correction)
}

Retourne UNIQUEMENT le JSON, sans texte supplémentaire.
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = ImproveTranscriptSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { transcript } = validation.data;

        // Vérifier que la clé API OpenAI est configurée
        if (!process.env.OPENAI_API_KEY) {
            // Si pas de clé API, retourner la transcription originale
            return NextResponse.json({
                improved: transcript,
                confidence: 'low'
            });
        }

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini', // Utiliser mini pour être plus rapide et moins cher
                messages: [
                    { role: 'system', content: IMPROVE_TRANSCRIPT_PROMPT },
                    { role: 'user', content: `Transcription à corriger : "${transcript}"` },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3, // Basse température pour des corrections précises
                max_tokens: 500,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) {
                return NextResponse.json({
                    improved: transcript,
                    confidence: 'low'
                });
            }

            try {
                const result = JSON.parse(content);
                return NextResponse.json(result);
            } catch (parseError) {
                console.error('Erreur de parsing JSON:', parseError);
                return NextResponse.json({
                    improved: transcript,
                    confidence: 'low'
                });
            }
        } catch (aiError: any) {
            console.error('Erreur lors de l\'amélioration de la transcription:', aiError);
            // En cas d'erreur, retourner la transcription originale
            return NextResponse.json({
                improved: transcript,
                confidence: 'low'
            });
        }
    } catch (error: any) {
        console.error('Erreur générale:', error);
        return NextResponse.json(
            { error: 'Erreur lors du traitement', message: error.message || 'Erreur inconnue' },
            { status: 500 }
        );
    }
}

