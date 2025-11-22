import { PrismaClient as PrismaClientPostgres } from "../../../prisma/generated/prisma-postgres/index.js";
import winston from "winston";

const PRISMA_KEY = Symbol.for("syncpad.prisma");

type GlobalWithPrisma = {
  [PRISMA_KEY]?: PrismaClientPostgres;
};

const globalForPrisma = globalThis as unknown as GlobalWithPrisma;


const createPrismaClient = (node_env: "development" | "test" | "production") => {
  return new PrismaClientPostgres({
    log: node_env === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const getPrismaClient = (node_env: "development" | "test" | "production") => {
  if (!globalForPrisma[PRISMA_KEY]) {
    const client = createPrismaClient(node_env);

    if (node_env !== "production") {
      globalForPrisma[PRISMA_KEY] = client;
    } else {
      return client;
    }
  }

  return globalForPrisma[PRISMA_KEY];
}

const disconnectPrismaClient = async (prisma: PrismaClientPostgres, logger: winston.Logger | globalThis.Console = console) => {
  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected gracefully");
  } catch (err) {
    logger.error("Error disconnecting prisma", err);
  }
};

export {
  getPrismaClient,
  disconnectPrismaClient,
}
