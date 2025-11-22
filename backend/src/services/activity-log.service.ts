import httpStatus from "http-status";
import { Prisma } from "../../../prisma/generated/prisma-postgres/index.js";
import prisma from "@syncpad/prisma-client";
import ApiError from "@/utils/ApiError.ts";
import { CreateActivityLogArgs, ListActivityLogsArgs } from "@/types/activity-log.types.ts";

const activityLogInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  document: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
  },
} as const;

const ensureDocumentBelongsToWorkspace = async (workspaceId: string, documentId: string) => {
  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId },
    select: { id: true },
  });

  if (!document) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found in workspace");
  }
};

const ensureActivityLogBelongsToWorkspace = async (workspaceId: string, activityLogId: string) => {
  const activityLog = await prisma.activityLog.findFirst({
    where: { id: activityLogId, workspaceId },
    select: { id: true },
  });

  if (!activityLog) {
    throw new ApiError(httpStatus.NOT_FOUND, "Activity log not found");
  }
};

const createActivityLog = async (
  workspaceId: string,
  input: Omit<CreateActivityLogArgs, "workspaceId">
) => {
  if (input.documentId) {
    await ensureDocumentBelongsToWorkspace(workspaceId, input.documentId);
  }

  return prisma.activityLog.create({
    data: {
      workspaceId,
      event: input.event,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      documentId: input.documentId ?? null,
      actorId: input.actorId ?? null,
    },
    include: activityLogInclude,
  });
};

const listActivityLogs = async ({
  workspaceId,
  limit,
  cursor,
  documentId,
  actorId,
  event,
}: ListActivityLogsArgs) => {
  const take = Math.min(limit ?? 25, 100);

  const where: Prisma.ActivityLogWhereInput = {
    workspaceId,
  };

  if (documentId) {
    where.documentId = documentId;
  }

  if (actorId) {
    where.actorId = actorId;
  }

  if (event) {
    where.event = event;
  }

  const activityLogs = await prisma.activityLog.findMany({
    where,
    include: activityLogInclude,
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: take + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = activityLogs.length > take;
  const nodes = hasMore ? activityLogs.slice(0, take) : activityLogs;
  const nextCursor = hasMore ? (nodes[nodes.length - 1]?.id ?? null) : null;

  return {
    activityLogs: nodes,
    nextCursor,
  };
};

const deleteActivityLog = async (workspaceId: string, activityLogId: string) => {
  await ensureActivityLogBelongsToWorkspace(workspaceId, activityLogId);

  await prisma.activityLog.delete({
    where: { id: activityLogId },
  });
};

export default {
  createActivityLog,
  listActivityLogs,
  deleteActivityLog,
};
