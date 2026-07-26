import { PrismaClient } from '@prisma/client';

/**
 * Singleton Factory function to instantiate the Prisma ORM Client.
 * Configures SQL query logging in development mode for debugging performance,
 * while restricting output to errors in production mode for cleaner log outputs.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Extend TypeScript global declaration to prevent creating multiple Prisma database connections
// when Next.js reloads modules in Hot Module Replacement (HMR) development mode.
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Reuse existing global instance if available, or create a new singleton instance
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Export the singleton Prisma instance as the default export for use in API routes & services
export default prisma;

// In development, attach the Prisma client instance to the globalThis object
// to avoid exhausting PostgreSQL connection pools during local file saves.
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
