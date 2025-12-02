import httpStatus from "http-status";

import prisma from "@syncpad/prisma-client";
import {
  CreateAiChatThreadArgs,
  GetAiChatThreadParams,
  EditAiChatThreadArgs,
  DeleteAiChatThreadParams,
  ListAiChatThreadArgs,
} from "@/types/ai-chat-thread.types.ts";
import ApiError from "@/utils/ApiError.js";
import { buildPaginationParams, paginateItems } from "@/utils/pagination.ts";

const createAiChatThread = async (
  { title, workspaceId }: CreateAiChatThreadArgs,
  userId: string | undefined
) => {
  return await prisma.ragChatThread.create({
    data: {
      workspaceId: workspaceId,
      title: title ?? null,
      createdById: userId ?? null,
    },
  });
};

const getAiChatThread = async ({ threadId, workspaceId }: GetAiChatThreadParams) => {
  const aiChatThread = await prisma.ragChatThread.findUnique({
    where: {
      id: threadId,
      workspaceId: workspaceId,
    },
  });

  if (!aiChatThread) {
    throw new ApiError(httpStatus.NOT_FOUND, "Chat thread not found");
  }

  return aiChatThread;
};

const updateAiChatThread = async ({ threadId, workspaceId, title }: EditAiChatThreadArgs) => {
  return await prisma.ragChatThread.update({
    where: { id: threadId, workspaceId: workspaceId },
    data: {
      title: title ?? null,
    },
  });
};

const deleteAiChatThread = async ({ threadId, workspaceId }: DeleteAiChatThreadParams) => {
  await prisma.ragChatThread.delete({
    where: { id: threadId, workspaceId: workspaceId },
  });
};

const listAiChatThreads = async ({ workspaceId, cursor, limit }: ListAiChatThreadArgs) => {
  const pagination = buildPaginationParams({ cursor: cursor, limit: limit });

  const chatThreads = await prisma.ragChatThread.findMany({
    where: {
      workspaceId: workspaceId,
    },
    orderBy: { createdAt: "desc" },
    take: pagination.take,
    ...(pagination.cursor ? { cursor: pagination.cursor, skip: pagination.skip } : {}),
  });

  const { items, nextCursor } = paginateItems(chatThreads, pagination.limit);

  return {
    threads: items,
    nextCursor,
  };
};

export default {
  createAiChatThread,
  getAiChatThread,
  updateAiChatThread,
  deleteAiChatThread,
  listAiChatThreads,
};
