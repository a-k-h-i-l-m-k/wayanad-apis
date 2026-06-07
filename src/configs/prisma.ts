import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Avoid logging every SQL statement — query logging adds noticeable
    // per-request overhead. Keep warnings/errors only. Set PRISMA_QUERY_LOG=1
    // to temporarily re-enable verbose query logging when debugging.
    log:
      process.env.PRISMA_QUERY_LOG === '1'
        ? ['query', 'error', 'warn']
        : ['error', 'warn'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
