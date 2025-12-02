import httpStatus from "http-status";

import prisma from "@syncpad/prisma-client";
import { RagChatRole } from "@generated/prisma-postgres/index.js";
import ApiError from "@/utils/ApiError.js";

type CreateThreadArgs = {
  workspaceId: string;
  createdById?: string | null;
  title?: string | null;
};

type AppendMessageArgs = {
  threadId: string;
  workspaceId: string;
  authorId?: string | null;
  role: RagChatRole;
  content: string;
  error?: boolean;
};

const DEFAULT_HISTORY_LIMIT = 30;

const getThread = async (workspaceId: string, threadId: string) => {
  return prisma.ragChatThread.findFirst({
    where: { id: threadId, workspaceId },
  });
};

const assertThreadInWorkspace = async (workspaceId: string, threadId: string) => {
  const thread = await getThread(workspaceId, threadId);

  if (!thread) {
    throw new ApiError(httpStatus.NOT_FOUND, "Chat thread not found");
  }

  return thread;
};

const createThread = async ({ workspaceId, createdById, title }: CreateThreadArgs) => {
  return prisma.ragChatThread.create({
    data: {
      workspaceId,
      createdById: createdById ?? null,
      title: title ?? null,
    },
  });
};

const appendMessage = async ({
  threadId,
  workspaceId,
  authorId,
  role,
  content,
  error,
}: AppendMessageArgs) => {
  const now = new Date();

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.ragChatMessage.create({
      data: {
        threadId,
        workspaceId,
        authorId: authorId ?? null,
        role,
        content,
        error: error ?? false,
      },
    });

    await tx.ragChatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: now },
    });

    return created;
  });

  return message;
};

const getRecentMessages = async (threadId: string, limit = DEFAULT_HISTORY_LIMIT) => {
  return prisma.ragChatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      content: true,
      role: true,
    },
  });
};

const getConversationHistory = async (threadId: string) => {
  return prisma.ragChatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    select: {
      content: true,
      role: true,
      error: true,
    },
  });
};

export default {
  getThread,
  assertThreadInWorkspace,
  createThread,
  appendMessage,
  getRecentMessages,
  getConversationHistory,
};
