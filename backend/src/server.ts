import app from "./app.js";
import env from "./config/index.js";
import logger from "./config/logger.js";
import prisma, { disconnectPrismaClient } from "@syncpad/prisma-client";
import hocuspocusServer, { shutdownHocuspocus } from "./config/hocuspocus.js";
import { getRedisClient, closeRedisClient } from "@syncpad/redis-client";

const server = app.listen(env.EXPRESS_PORT, () => {
  logger.info(`Listening to port ${env.EXPRESS_PORT}`);
});

const exitHandler = async (exitCode = 0) => {
  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      logger.info("Server closed");
    }

    if (hocuspocusServer) {
      await shutdownHocuspocus();
    }

    const redisClient = getRedisClient(env.REDIS_URL ?? env.BACKEND_REDIS_URL, logger);

    closeRedisClient(redisClient);

    await disconnectPrismaClient(prisma);
  } catch (err) {
    logger.error("Error during shutdown", err);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
};

const unexpectedErrorHandler = async (error: Error) => {
  logger.error(error);
  await exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGINT", async () => {
  logger.info("SIGINT received");
  await exitHandler();
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received");
  await exitHandler();
});
