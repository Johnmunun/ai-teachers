import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'Fichier audio requis' },
                { status: 400 }
            );
        }

        // Convertir le fichier en format requis par OpenAI Whisper
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Créer un File pour Whisper (OpenAI accepte File directement)
        // Note: En Node.js, on doit créer un File-like object
        const file = new File([buffer], audioFile.name || 'recording.webm', { 
            type: audioFile.type || 'audio/webm' 
        });

        // Transcription avec Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'fr', // Français
            response_format: 'text',
        });

        // Whisper retourne directement le texte si response_format est 'text'
        const text = typeof transcription === 'string' ? transcription : (transcription as any).text || '';

        return NextResponse.json({ 
            text: text.trim()
        });
    } catch (error: any) {
        console.error('Whisper transcription error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la transcription', message: error.message },
            { status: 500 }
        );
    }
}

