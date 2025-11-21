import { PrismaClient as PrismaClientPostgres } from "../../../prisma/generated/prisma-postgres/index.js";
import env from "@/config/config.js";
import logger from "@/config/logger.js";

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
    logger.info("Prisma embedding_worker client disconnected gracefully");
  } catch (err) {
    logger.error("Error disconnecting prisma embedding_worker client", err);
  }
};

export default prisma;
