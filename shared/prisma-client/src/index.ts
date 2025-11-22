import { getPrismaClient, disconnectPrismaClient } from "./client.js"

const env = (process.env.NODE_ENV ?? "development") as
  | "development"
  | "test"
  | "production";

const prisma = getPrismaClient(env);

export default prisma;

export {
  getPrismaClient,
  disconnectPrismaClient,
};