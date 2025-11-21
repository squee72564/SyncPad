import { createClient, type RedisClientType } from "redis";
import env from "../config/index.js";
import logger from "../config/logger.js";

const MAX_RECONNECT_DELAY = 5000;
const INITIAL_RECONNECT_DELAY = 200;

let client: RedisClientType | null = null;

const createRedisClient = () =>
  createClient({
    url: env.REDIS_URL,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 10_000,
      keepAlive: true,
      reconnectStrategy: (retries: number) =>
        Math.min(INITIAL_RECONNECT_DELAY * retries, MAX_RECONNECT_DELAY),
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
  client.on("reconnecting", (delay) => logger.warn(`Redis reconnect scheduled in ${delay}ms`));
  client.on("end", () => logger.warn("Redis connection closed"));

  return client;
};

export default getRedisClient;
