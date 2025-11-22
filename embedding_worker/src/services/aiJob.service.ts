import { AiJobStatus, Prisma } from "../../../prisma/generated/prisma-postgres/index.js";
import prisma from "@syncpad/prisma-client";
import logger from "@/config/logger.ts";

const safeUpdate = async (jobId: string, data: Prisma.AiJobUpdateInput) => {
  if (!jobId) {
    return;
  }

  try {
    await prisma.aiJob.update({
      where: { id: jobId },
      data,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      logger.warn("Attempted to update missing AI job", { jobId });
      return;
    }

    logger.error("Failed to update AI job status", { jobId, error });
  }
};

const markJobRunning = async (jobId: string) => {
  await safeUpdate(jobId, {
    status: AiJobStatus.RUNNING,
    startedAt: new Date(),
    error: null,
  });
};

const markJobCompleted = async (jobId: string) => {
  await safeUpdate(jobId, {
    status: AiJobStatus.COMPLETED,
    completedAt: new Date(),
    error: null,
  });
};

const markJobFailed = async (jobId: string, errorMessage: string) => {
  await safeUpdate(jobId, {
    status: AiJobStatus.FAILED,
    completedAt: new Date(),
    error: errorMessage,
  });
};

export default {
  markJobRunning,
  markJobCompleted,
  markJobFailed,
};
