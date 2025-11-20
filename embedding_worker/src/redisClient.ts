import { createClient, RedisClientType } from "redis";
import config from "@/config/config.ts";

export default function redisClientFactory(): RedisClientType {
  const client = createClient({
    url: config.REDIS_URL,
  }) as RedisClientType;

  client.on("error", (err) => console.error("Redis Client Error", err));

  client.on("connect", () => {
    console.log("Connected to Redis");
  });

  return client;
}
