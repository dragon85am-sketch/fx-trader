import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Reuse the client within a warm server instance, including production.
// This does not share connections across different Vercel instances.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] });

globalForPrisma.prisma = prisma;
