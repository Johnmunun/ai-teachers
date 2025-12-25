import { createHash } from 'crypto';

// Fallback in-memory cache pour le développement si Vercel KV n'est pas configuré
const inMemoryCache = new Map<string, { value: string; expiresAt: number }>();

// Import conditionnel de Vercel KV
let kv: any = null;
if (typeof window === 'undefined') {
  // Server-side seulement
  try {
    const kvModule = require('@vercel/kv');
    kv = kvModule.kv;
  } catch (error) {
    // KV non disponible, utiliser cache mémoire
  }
}

/**
 * Génère une clé de cache à partir d'un prompt
 */
function generateCacheKey(prompt: string, prefix: string = 'ai'): string {
  const hash = createHash('sha256').update(prompt).digest('hex');
  return `${prefix}:${hash}`;
}

/**
 * Récupère une réponse IA depuis le cache
 */
export async function getCachedAIResponse(
  prompt: string,
  prefix: string = 'ai',
  ttl: number = 86400 // 24 heures par défaut
): Promise<string | null> {
  try {
    const key = generateCacheKey(prompt, prefix);
    
    // Essayer Vercel KV d'abord
    if (kv && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const cached = await (kv as any).get(key) as string | null;
        if (cached) return cached;
      } catch (error) {
        console.warn('KV get error:', error);
      }
    }
    
    // Fallback: cache en mémoire (dev uniquement)
    const cached = inMemoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    
    // Nettoyer les entrées expirées du cache mémoire
    if (cached && cached.expiresAt <= Date.now()) {
      inMemoryCache.delete(key);
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du cache:', error);
    return null;
  }
}

/**
 * Stocke une réponse IA dans le cache
 */
export async function setCachedAIResponse(
  prompt: string,
  response: string,
  prefix: string = 'ai',
  ttl: number = 86400 // 24 heures par défaut
): Promise<void> {
  try {
    const key = generateCacheKey(prompt, prefix);
    
    // Essayer Vercel KV d'abord
    if (kv && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        await (kv as any).setex(key, ttl, response);
        return;
      } catch (error) {
        console.warn('KV set error:', error);
      }
    }
    
    // Fallback: cache en mémoire (dev uniquement)
    const expiresAt = Date.now() + (ttl * 1000);
    inMemoryCache.set(key, { value: response, expiresAt });
    
    // Nettoyer périodiquement le cache mémoire (garder max 1000 entrées)
    if (inMemoryCache.size > 1000) {
      const entries = Array.from(inMemoryCache.entries());
      entries
        .filter(([_, v]) => v.expiresAt <= Date.now())
        .forEach(([k]) => inMemoryCache.delete(k));
    }
  } catch (error) {
    console.error('Erreur lors du stockage dans le cache:', error);
    // Ne pas bloquer l'exécution si le cache échoue
  }
}

/**
 * Invalide le cache pour un prompt
 */
export async function invalidateCache(prompt: string, prefix: string = 'ai'): Promise<void> {
  try {
    const key = generateCacheKey(prompt, prefix);
    
    if (kv && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        await (kv as any).del(key);
        return;
      } catch (error) {
        console.warn('KV del error:', error);
      }
    }
    inMemoryCache.delete(key);
  } catch (error) {
    console.error('Erreur lors de l\'invalidation du cache:', error);
  }
}

/**
 * Génère une clé de cache pour un utilisateur (pour la mémoire conversationnelle)
 */
export function generateUserMemoryKey(userId: string, context: string = 'general'): string {
  return `memory:${userId}:${context}`;
}

/**
 * Récupère la mémoire conversationnelle d'un utilisateur
 */
export async function getUserMemory(userId: string, context: string = 'general'): Promise<any[] | null> {
  try {
    const key = generateUserMemoryKey(userId, context);
    
    if (kv && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        return await (kv as any).get(key) as any[] | null;
      } catch (error) {
        console.warn('KV get memory error:', error);
      }
    }
    
    const cached = inMemoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return JSON.parse(cached.value);
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la mémoire:', error);
    return null;
  }
}

/**
 * Stocke la mémoire conversationnelle d'un utilisateur
 */
export async function setUserMemory(
  userId: string,
  memory: any[],
  context: string = 'general',
  ttl: number = 2592000 // 30 jours
): Promise<void> {
  try {
    const key = generateUserMemoryKey(userId, context);
    const serialized = JSON.stringify(memory);
    
    if (kv && process.env.KV_REST_API_TOKEN && process.env.KV_REST_API_URL) {
      try {
        await (kv as any).setex(key, ttl, serialized);
        return;
      } catch (error) {
        console.warn('KV set memory error:', error);
      }
    }
    
    const expiresAt = Date.now() + (ttl * 1000);
    inMemoryCache.set(key, { value: serialized, expiresAt });
  } catch (error) {
    console.error('Erreur lors du stockage de la mémoire:', error);
  }
}

/**
 * Nettoie le cache mémoire (pour éviter les fuites mémoire)
 */
export function clearInMemoryCache(): void {
  const now = Date.now();
  const entries = Array.from(inMemoryCache.entries());
  
  entries.forEach(([key, value]) => {
    if (value.expiresAt <= now) {
      inMemoryCache.delete(key);
    }
  });
}

// Nettoyer le cache toutes les heures
if (typeof setInterval !== 'undefined') {
  setInterval(clearInMemoryCache, 3600000); // 1 heure
}

