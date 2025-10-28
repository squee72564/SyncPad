import { PrismaClient as PrismaClientPostgres } from "../../prisma/generated/prisma-postgres/index.js";
import env from "../config/index.js";
import logger from "../config/logger.js";

// It is recommended to use a connection pooler to manage database connections efficiently
// Avoid instantiating PrismaClient globally in long lived environments
// Instead create and dispose of the client per request to prevent exhausting db connections

const getPrisma = () =>
  new PrismaClientPostgres({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof getPrisma>;
};

const prisma = globalForPrisma.prisma || getPrisma();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected gracefully");
  } catch (err) {
    logger.error("Error disconnecting prisma", err);
  }
};

export default prisma;
