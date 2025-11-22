import { randomUUID } from "node:crypto";
import env from "../config/index.js";
import logger from "../config/logger.js";
import { getRedisClient } from "@syncpad/redis-client";

type EmbeddingJobPayload = {
  jobId?: string;
  workspaceId: string;
  documentId: string;
  revisionId?: string | null;
  type?: "EMBEDDING";
  payload?: string;
};

const serializePayload = (payload: EmbeddingJobPayload): Record<string, string> => {
  if (!payload.workspaceId || !payload.documentId) {
    throw new Error("Workspace ID and Document ID are required for embedding job");
  }

  return {
    jobId: payload.jobId ?? randomUUID(),
    workspaceId: payload.workspaceId,
    documentId: payload.documentId,
    ...(payload.revisionId ? { revisionId: payload.revisionId } : {}),
    type: payload.type ?? "EMBEDDING",
    ...(payload.payload ? { payload: payload.payload } : {}),
  };
};

const enqueueEmbeddingJob = async (payload: EmbeddingJobPayload) => {
  const client = getRedisClient(env.REDIS_URL, logger);

  if (!client.isOpen) {
    await client.connect();
  }

  const message = serializePayload(payload);
  await client.xAdd(env.EMBEDDING_REDIS_STREAM_KEY, "*", message);
  logger.info("Queued embedding job", {
    documentId: payload.documentId,
    workspaceId: payload.workspaceId,
    jobId: message.jobId,
  });

  return message.jobId;
};

export default {
  enqueueEmbeddingJob,
};
