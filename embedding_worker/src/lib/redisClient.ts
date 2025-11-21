import { createClient, RedisClientType } from "redis";
import config from "@/config/config.ts";
import logger from "@/config/logger.ts";

const MAX_RECONNECT_DELAY = 5000;
const INITIAL_RECONNECT_DELAY = 200;

export default function redisClientFactory(): RedisClientType {
  const client = createClient({
    url: config.REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 10000,
      keepAlive: true,
      reconnectStrategy: (retries) => {
        const delay = Math.min(INITIAL_RECONNECT_DELAY * retries, MAX_RECONNECT_DELAY);
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

  client.on("reconnecting", (delay) => {
    logger.warn(`Redis reconnect scheduled in ${delay}ms`);
  });

  client.on("end", () => {
    logger.warn("Redis connection closed");
  });

  return client;
}
