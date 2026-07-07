import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida");
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

function hasCurrentModels(client: PrismaClient | undefined) {
  return Boolean(client && "product" in client);
}

export const prisma = hasCurrentModels(globalForPrisma.prisma)
  ? globalForPrisma.prisma!
  : createPrismaClient();

globalForPrisma.prisma = prisma;
