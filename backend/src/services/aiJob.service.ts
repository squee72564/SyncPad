import { Prisma, AiJobStatus, AiJobType } from "@generated/prisma-postgres/index.js";
import prisma from "@syncpad/prisma-client";
import type { ListAiJobsQuery } from "@/types/ai-job.types.ts";

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

const listAiJobs = async (workspaceId: string, query: ListAiJobsQuery) => {
  const limit = query.limit ?? 50;

  const where: Prisma.AiJobWhereInput = {
    workspaceId,
  };

  if (query.status) {
    where.status = query.status as AiJobStatus;
  }

  if (query.type) {
    where.type = query.type as AiJobType;
  }

  if (query.documentId) {
    where.documentId = query.documentId;
  }

  const aiJobs = await prisma.aiJob.findMany({
    where,
    include: {
      document: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [{ queuedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(query.cursor
      ? {
          cursor: { id: query.cursor },
          skip: 1,
        }
      : {}),
  });

  const hasNextPage = aiJobs.length > limit;
  const trimmed = hasNextPage ? aiJobs.slice(0, limit) : aiJobs;

  const nextCursor = hasNextPage ? (trimmed[trimmed.length - 1]?.id ?? null) : null;

  return {
    aiJobs: trimmed,
    nextCursor,
  };
};

const listAiJob = (aiJobId: string, workspaceId: string) => {
  return prisma.aiJob.findFirst({
    where: {
      id: aiJobId,
      workspaceId,
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
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
