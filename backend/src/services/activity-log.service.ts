import httpStatus from "http-status";
import { Prisma } from "../../prisma/generated/prisma-postgres/index.js";
import prisma from "../lib/prisma.js";
import ApiError from "@/utils/ApiError.ts";
import { CreateActivityLogArgs } from "@/types/activity-log.types.ts";

const ensureDocumentBelongsToWorkspace = async (workspaceId: string, documentId: string) => {
  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId },
    select: { id: true },
  });

  if (!document) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found in workspace");
  }
};

const ensureActivityLogBelongsToWorkspace = async (
  workspaceId: string,
  activityLogId: string
) => {
  const activityLog = await prisma.activityLog.findFirst({
    where: { id: activityLogId, workspaceId },
    select: { id: true },
  });

  if (!activityLog) {
    throw new ApiError(httpStatus.NOT_FOUND, "Activity log not found");
  }
};

type CreateActivityLogInput = {
  event: string;
  metadata?: Prisma.JsonValue;
  documentId?: string;
  actorId?: string | null;
};

const createActivityLog = async (workspaceId: string, input: Omit<CreateActivityLogArgs, "workspaceId">) => {
  if (input.documentId) {
    await ensureDocumentBelongsToWorkspace(workspaceId, input.documentId);
  }

  return prisma.activityLog.create({
    data: {
      workspaceId,
      event: input.event,
      metadata: input.metadata ?? {},
      documentId: input.documentId ?? null,
      actorId: input.actorId ?? null,
    },
  });
};

const deleteActivityLog = async (workspaceId: string, activityLogId: string) => {
  await ensureActivityLogBelongsToWorkspace(workspaceId, activityLogId);

  await prisma.activityLog.delete({
    where: { id: activityLogId },
  });
};

export default {
  createActivityLog,
  deleteActivityLog,
};
