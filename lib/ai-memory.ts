import { prisma } from './prisma';
import { getUserMemory, setUserMemory } from './cache';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    lessonId?: string;
    context?: string;
    [key: string]: any;
  };
}

export interface UserMemorySummary {
  preferences: {
    learningStyle?: string;
    preferredLanguage?: string;
    difficultyLevel?: string;
  };
  recentTopics: string[];
  strengths: string[];
  weaknesses: string[];
  lastInteraction: Date;
}

/**
 * Récupère l'historique de conversation d'un utilisateur
 */
export async function getConversationHistory(
  userId: string,
  context: string = 'general',
  limit: number = 20
): Promise<ConversationMessage[]> {
  try {
    // Essayer d'abord le cache rapide
    const cached = await getUserMemory(userId, context);
    if (cached && Array.isArray(cached)) {
      return cached.slice(-limit).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }

    // Sinon, récupérer depuis la DB
    const memories = await prisma.aiMemory.findMany({
      where: {
        userId,
        context,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    const messages: ConversationMessage[] = memories.map((mem) => ({
      role: mem.role as 'user' | 'assistant' | 'system',
      content: mem.content,
      timestamp: mem.createdAt,
      metadata: mem.metadata as any,
    }));

    // Mettre en cache pour les prochaines requêtes
    await setUserMemory(userId, messages, context);

    return messages.reverse(); // Plus ancien en premier
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return [];
  }
}

/**
 * Sauvegarde un message dans la mémoire de l'utilisateur
 */
export async function saveConversationMessage(
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  context: string = 'general',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // Sauvegarder dans la DB
    await prisma.aiMemory.create({
      data: {
        userId,
        role,
        content,
        context,
        metadata: metadata || {},
      },
    });

    // Mettre à jour le cache
    const history = await getConversationHistory(userId, context, 20);
    history.push({
      role,
      content,
      timestamp: new Date(),
      metadata,
    });
    
    // Garder seulement les 20 derniers messages dans le cache
    const recentHistory = history.slice(-20);
    await setUserMemory(userId, recentHistory, context);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du message:', error);
  }
}

/**
 * Construit le contexte pour l'IA à partir de l'historique
 */
export async function buildConversationContext(
  userId: string,
  context: string = 'general',
  maxMessages: number = 10
): Promise<string> {
  const history = await getConversationHistory(userId, context, maxMessages);
  
  if (history.length === 0) {
    return '';
  }

  return history
    .map((msg) => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
}

/**
 * Génère un résumé de la mémoire utilisateur pour l'IA
 */
export async function getUserMemorySummary(userId: string): Promise<UserMemorySummary | null> {
  try {
    // Récupérer toutes les conversations récentes
    const memories = await prisma.aiMemory.findMany({
      where: {
        userId,
        role: 'user', // Seulement les messages utilisateur pour analyser
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // 100 derniers messages
    });

    if (memories.length === 0) {
      return null;
    }

    // Extraire les préférences et patterns (simplifié, pourrait être amélioré avec IA)
    const recentTopics = Array.from(
      new Set(memories.map((m) => m.content.substring(0, 50)).slice(0, 10))
    );

    return {
      preferences: {
        // Pourrait être extrait avec analyse IA
      },
      recentTopics,
      strengths: [], // À implémenter avec analyse IA
      weaknesses: [], // À implémenter avec analyse IA
      lastInteraction: memories[0].createdAt,
    };
  } catch (error) {
    console.error('Erreur lors de la génération du résumé:', error);
    return null;
  }
}

/**
 * Nettoie les anciennes conversations (garde seulement les 90 derniers jours)
 */
export async function cleanupOldMemories(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.aiMemory.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    return 0;
  }
}

/**
 * Récupère les statistiques de mémoire pour un utilisateur
 */
export async function getMemoryStats(userId: string): Promise<{
  totalMessages: number;
  contexts: string[];
  oldestMessage: Date | null;
  newestMessage: Date | null;
}> {
  try {
    const [total, contexts, oldest, newest] = await Promise.all([
      prisma.aiMemory.count({
        where: { userId },
      }),
      prisma.aiMemory.findMany({
        where: { userId },
        select: { context: true },
        distinct: ['context'],
      }),
      prisma.aiMemory.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.aiMemory.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalMessages: total,
      contexts: contexts.map((c) => c.context),
      oldestMessage: oldest?.createdAt || null,
      newestMessage: newest?.createdAt || null,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return {
      totalMessages: 0,
      contexts: [],
      oldestMessage: null,
      newestMessage: null,
    };
  }
}

