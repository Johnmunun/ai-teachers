import { NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { auth } from '@/auth';
import { z } from 'zod';

const COURSE_GENERATOR_PROMPT = `
Tu es un expert en création de programmes de formation en informatique.
Génère un plan de cours complet et structuré basé sur le sujet fourni.

FORMAT JSON OBLIGATOIRE:
{
  "title": "Titre du module",
  "description": "Description détaillée du module",
  "objectives": ["Objectif 1", "Objectif 2", ...],
  "estimatedHours": 20,
  "prerequisites": ["Prérequis 1", ...],
  "courses": [
    {
      "title": "Titre du cours",
      "description": "Description du cours",
      "estimatedMinutes": 60,
      "topics": ["Sujet 1", "Sujet 2", ...],
      "exercises": [
        {
          "title": "Exercice 1",
          "description": "Description de l'exercice",
          "difficulty": "easy|medium|hard"
        }
      ],
      "codeExamples": [
        {
          "title": "Exemple 1",
          "language": "html|css|javascript|python|...",
          "code": "// Code exemple"
        }
      ]
    }
  ],
  "assessmentSuggestions": [
    {
      "type": "quiz|project|exercise",
      "title": "Titre de l'évaluation",
      "description": "Description"
    }
  ]
}

RÈGLES:
1. Sois exhaustif mais pratique
2. Adapte le niveau au public cible
3. Inclus des exemples de code concrets
4. Propose des exercices progressifs
5. Chaque cours doit être réalisable en 1-2 heures max
`;

const CourseGeneratorSchema = z.object({
  topic: z.string().min(1, 'Le sujet est requis'),
  level: z.string().optional(),
  duration: z.string().optional(),
  language: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const validation = CourseGeneratorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { topic, level, duration, language } = validation.data;

    // Vérifier que la clé API OpenAI est configurée
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Configuration OpenAI manquante' },
        { status: 500 }
      );
    }

    const userPrompt = `
      Sujet: ${topic}
      Niveau: ${level || 'débutant à intermédiaire'}
      Durée souhaitée: ${duration || '20 heures'}
      Langue de programmation principale: ${language || 'non spécifié'}
      
      Génère un plan de cours complet et professionnel.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: COURSE_GENERATOR_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Aucune réponse générée par l\'IA' },
        { status: 500 }
      );
    }

    let courseData;
    try {
      courseData = JSON.parse(content);
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      return NextResponse.json(
        { error: 'Format de réponse invalide', content },
        { status: 500 }
      );
    }

    if (!courseData.title || !courseData.courses) {
      return NextResponse.json(
        { error: 'Données de cours incomplètes générées' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      course: courseData 
    });
  } catch (error: any) {
    console.error('AI Course Generator error:', error);
    
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
      { error: 'Erreur lors de la génération du cours', message: error.message || 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

