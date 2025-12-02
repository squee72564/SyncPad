import httpStatus from "http-status";

import prisma from "@syncpad/prisma-client";
import { Prisma } from "@generated/prisma-postgres/index.js";
import ApiError from "@/utils/ApiError.js";
import {
  CreateAiChatMessageArgs,
  RetrieveAiChatMessageParams,
  UpdateAiChatMessageArgs,
  DeleteAiChatMessageParams,
  ListAiChatMessageArgs,
  RunRagPipelineArgs,
} from "@/types/ai-chat-messages.types.ts";
import { buildPaginationParams, paginateItems } from "@/utils/pagination.ts";
import RAGOrchestrator from "@/lib/rag/rag-pipeline.ts";

const ragOrchestrator = new RAGOrchestrator();

const createAiChatMessage = async ({
  workspaceId,
  threadId,
  authorId,
  role,
  content,
  error,
}: CreateAiChatMessageArgs) => {
  return prisma.ragChatMessage.create({
    data: {
      threadId,
      workspaceId,
      authorId: authorId ?? null,
      role,
      content,
      error,
    },
  });
};

const getAiChatMessage = async ({
  workspaceId,
  threadId,
  messageId,
}: RetrieveAiChatMessageParams) => {
  const aiChatMessage = await prisma.ragChatMessage.findUnique({
    where: { id: messageId, threadId, workspaceId },
  });

  if (!aiChatMessage) {
    throw new ApiError(httpStatus.NOT_FOUND, "RagChatMessage not found");
  }

  return aiChatMessage;
};

const updateAiChatMessage = async ({
  workspaceId,
  threadId,
  messageId,
  authorId,
  role,
  content,
  error,
}: UpdateAiChatMessageArgs) => {
  const data = {} as Prisma.RagChatMessageUpdateArgs["data"];

  if (authorId) data.authorId = authorId;
  if (role) data.role = role;
  if (content) data.content = content;
  if (error) data.error = error;

  return await prisma.ragChatMessage.update({
    where: {
      id: messageId,
      workspaceId,
      threadId,
    },
    data,
  });
};

const deleteAiChatMessage = async ({
  workspaceId,
  threadId,
  messageId,
}: DeleteAiChatMessageParams) => {
  await prisma.ragChatMessage.delete({
    where: {
      id: messageId,
      workspaceId,
      threadId,
    },
  });
};

const listAiChatMessages = async ({
  workspaceId,
  threadId,
  cursor,
  limit,
  order = "desc",
}: ListAiChatMessageArgs & { order: "desc" | "asc" }) => {
  const pagination = buildPaginationParams({ cursor: cursor, limit: limit });

  const chatMessages = await prisma.ragChatMessage.findMany({
    where: {
      workspaceId,
      threadId,
    },
    select: {
      id: true,
      content: true,
      role: true,
      error: true,
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: order },
    take: pagination.take,
    ...(pagination.cursor ? { cursor: pagination.cursor, skip: pagination.skip } : {}),
  });

  const { items, nextCursor } = paginateItems(chatMessages, pagination.limit);

  return {
    messages: items,
    nextCursor,
  };
};

type RagPipelineResult =
  | { success: true; data: string }
  | { success: false; type: "Agent" | "InputGuardrail"; error: string };

const runRagPipeline = async ({
  workspaceId,
  threadId,
  query,
  limit,
}: RunRagPipelineArgs & { limit: number }): Promise<RagPipelineResult> => {
  const { messages: recentMessages } = await listAiChatMessages({
    workspaceId,
    threadId,
    cursor: undefined,
    limit,
    order: "asc",
  });

  const filteredMessageHistory = recentMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const result = await ragOrchestrator.runRAGPipeline(workspaceId, query, filteredMessageHistory);

  if (!result.success) {
    return {
      success: false,
      type: result.type,
      error: result.type === "Agent" ? result.error : "Your request cannot be processed.",
    };
  }

  return {
    success: true,
    data: result.data,
  };
};

export default {
  createAiChatMessage,
  getAiChatMessage,
  updateAiChatMessage,
  deleteAiChatMessage,
  listAiChatMessages,
  runRagPipeline,
};
