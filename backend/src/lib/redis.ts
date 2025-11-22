import { createClient, type RedisClientType } from "redis";
import env from "../config/index.js";
import logger from "../config/logger.js";

const MAX_RECONNECT_DELAY = 5000;
const INITIAL_RECONNECT_DELAY = 200;

let client: RedisClientType | null = null;

const resolveReconnectDelay = (retries: number) => {
  const attempt = Number.isFinite(retries) && retries > 0 ? retries : 1;
  return Math.min(INITIAL_RECONNECT_DELAY * attempt, MAX_RECONNECT_DELAY);
};

const createRedisClient = () =>
  createClient({
    url: env.BACKEND_REDIS_URL ?? env.REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 10_000,
      keepAlive: true,
      reconnectStrategy: (retries: number) => {
        const delay = resolveReconnectDelay(retries);
        logger.warn(`Redis reconnect scheduled in ${delay}ms (attempt ${retries})`);
        return delay;
      },
    },
  });

const getRedisClient = () => {
  if (client) {
    return client;
  }

  client = createRedisClient() as RedisClientType;

  client.on("error", (err) => logger.error("Redis client error", err));
  client.on("connect", () => logger.info("Connecting to Redis..."));
  client.on("ready", () => logger.info("Redis connection ready"));
  client.on("end", () => logger.warn("Redis connection closed"));

  return client;
};

const closeRedisClient = async (client: RedisClientType) => {
  try {
    if (client.isOpen) {
      await client.close();
    }
    logger.info("Redis Client closed");
  } catch (error) {
    logger.error("Error closing Redis connection: ", error);
  }
};

export { getRedisClient, closeRedisClient };
