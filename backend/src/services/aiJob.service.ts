import { Prisma, AiJobStatus, AiJobType } from "@generated/prisma-postgres/index.js";
import prisma from "@syncpad/prisma-client";

type CreateAiJobArgs = {
  workspaceId: string;
  documentId?: string;
  revisionId?: string | null;
  requestedById?: string | null;
  type: AiJobType;
  payload?: Prisma.JsonValue;
};

const createAiJob = async (args: CreateAiJobArgs) => {
  return prisma.aiJob.create({
    data: {
      workspaceId: args.workspaceId,
      documentId: args.documentId ?? null,
      revisionId: args.revisionId ?? null,
      requestedById: args.requestedById ?? null,
      type: args.type,
      status: AiJobStatus.PENDING,
      payload: args.payload ?? Prisma.JsonNull,
      queuedAt: new Date(),
    },
  });
};

const markJobRunning = async (jobId: string) => {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: AiJobStatus.RUNNING,
      startedAt: new Date(),
      error: null,
    },
  });
};

const markJobCompleted = async (jobId: string) => {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: AiJobStatus.COMPLETED,
      completedAt: new Date(),
      error: null,
    },
  });
};

const markJobFailed = async (jobId: string, error: string) => {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: AiJobStatus.FAILED,
      completedAt: new Date(),
      error,
    },
  });
};

const listAiJobs = (workspaceId: string) => {
  return prisma.aiJob.findMany({
    where: {
      workspaceId: workspaceId,
    },
  });
};

const listAiJob = (aiJobId: string, workspaceId: string) => {
  return prisma.aiJob.findUnique({
    where: {
      id: aiJobId,
      workspaceId: workspaceId,
    },
  });
};

export default {
  createAiJob,
  markJobRunning,
  markJobCompleted,
  markJobFailed,
  listAiJobs,
  listAiJob,
};
