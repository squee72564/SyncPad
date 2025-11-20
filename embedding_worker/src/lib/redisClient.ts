import { createClient, RedisClientType } from "redis";
import config from "@/config/config.ts";
import logger from "@/config/logger.ts";

export default function redisClientFactory(): RedisClientType {
  const client = createClient({
    url: config.REDIS_URL,
  }) as RedisClientType;

  client.on("error", (err) => logger.error("Redis Client Error", err));

  client.on("connect", () => {
    logger.info("Connected to Redis");
  });

  return client;
}
