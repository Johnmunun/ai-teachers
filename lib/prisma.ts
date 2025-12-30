import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configuration avec connection pooling optimisé
const databaseUrl = process.env.DATABASE_URL;
const optimizedUrl = databaseUrl?.includes('?')
  ? `${databaseUrl}&connection_limit=10&pool_timeout=20`
  : `${databaseUrl}?connection_limit=10&pool_timeout=20`;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: databaseUrl
      ? {
          db: {
            url: optimizedUrl,
          },
        }
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
