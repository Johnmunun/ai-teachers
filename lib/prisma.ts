import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configuration avec connection pooling optimisé
const databaseUrl = process.env.DATABASE_URL;
let optimizedUrl: string | undefined;

if (databaseUrl) {
  try {
    // Valider que DATABASE_URL est une URL valide
    new URL(databaseUrl);
    optimizedUrl = databaseUrl.includes('?')
      ? `${databaseUrl}&connection_limit=10&pool_timeout=20`
      : `${databaseUrl}?connection_limit=10&pool_timeout=20`;
  } catch (error) {
    console.warn('Invalid DATABASE_URL format:', error);
    optimizedUrl = undefined;
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: optimizedUrl
      ? {
          db: {
            url: optimizedUrl,
          },
        }
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
