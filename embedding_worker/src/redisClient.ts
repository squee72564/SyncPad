import { createClient } from "redis";
import config from "./config/config.ts";

export default function redisClientFactory() {
  const client = createClient({
    url: config.REDIS_URL,
  });

  client.on("error", (err) => console.error("Redis Client Error", err));

  client.on("connect", () => {
    console.log("Connected to Redis");
  });

  return client;
}
