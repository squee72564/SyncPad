import { createClient, RedisClientType } from "redis";
import config from "@/config/config.ts";
import logger from "@/config/logger.ts";

const MAX_RECONNECT_DELAY = 5000;
const INITIAL_RECONNECT_DELAY = 200;

const resolveReconnectDelay = (retries: number) => {
  const attempt = Number.isFinite(retries) && retries > 0 ? retries : 1;
  return Math.min(INITIAL_RECONNECT_DELAY * attempt, MAX_RECONNECT_DELAY);
};

export default function redisClientFactory(): RedisClientType {
  const client = createClient({
    url: config.BACKEND_REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 10000,
      keepAlive: true,
      reconnectStrategy: (retries) => {
        const delay = resolveReconnectDelay(retries);
        logger.warn(`Redis reconnect scheduled in ${delay}ms (attempt ${retries})`);
        return delay;
      },
    },
  }) as RedisClientType;

  client.on("error", (err) => logger.error("Redis client error", err));

  client.on("connect", () => {
    logger.info("Connecting to Redis...");
  });

  client.on("ready", () => {
    logger.info("Redis connection ready");
  });

  client.on("end", () => {
    logger.warn("Redis connection closed");
  });

  return client;
}
