import type { Response, NextFunction } from "express";
import httpStatus from "http-status";

import logger from "@/config/logger.ts";
import { aiChatMessageService } from "@/services/index.ts";
import ApiError from "@/utils/ApiError.js";
import catchAsync from "@/utils/catchAsync.js";
import {
  RetrieveAiChatMessageRequest,
  UpdateAiChatMessageRequest,
  DeleteAiChatMessageRequest,
  ListAiChatMessageRequest,
  RunRagPipelineRequest,
} from "@/types/ai-chat-messages.types.ts";

const GetAiChatMessage = catchAsync(
  async (req: RetrieveAiChatMessageRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const aiChatMessage = await aiChatMessageService.getAiChatMessage({
      ...req.params,
    });

    res.send(httpStatus.OK).json(aiChatMessage);
  }
);

const UpdateAiChatMessage = catchAsync(
  async (req: UpdateAiChatMessageRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const updatedAiChatMessage = await aiChatMessageService.updateAiChatMessage({
      ...req.params,
      ...req.body,
    });

    res.send(httpStatus.OK).json(updatedAiChatMessage);
  }
);

const DeleteAiChatMessage = catchAsync(
  async (req: DeleteAiChatMessageRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    await aiChatMessageService.deleteAiChatMessage(req.params);

    res.send(httpStatus.NO_CONTENT);
  }
);

const ListAiChatMessages = catchAsync(
  async (req: ListAiChatMessageRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await aiChatMessageService.listAiChatMessages({
      ...req.params,
      ...req.query,
      order: "asc",
    });

    res.status(httpStatus.OK).json({
      data: result.messages,
      nextCursor: result.nextCursor,
    });
  }
);

const runRagPipeline = catchAsync(
  async (req: RunRagPipelineRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    await aiChatMessageService.createAiChatMessage({
      ...req.params,
      role: "USER",
      error: false,
      authorId: req.user.id,
      content: req.body.query,
    });

    const startedAt = Date.now();

    const result = await aiChatMessageService.runRagPipeline({
      ...req.params,
      ...req.body,
      limit: 5,
    });

    const latencyMs = Date.now() - startedAt;

    logger.info("RAG pipeline executed", {
      workspaceId: req.params.workspaceId,
      userId: req.user.id,
      result: result,
      latency: `${latencyMs / 1000} seconds`,
    });

    if (result.success) {
      await aiChatMessageService.createAiChatMessage({
        ...req.params,
        role: "ASSISTANT",
        error: false,
        authorId: undefined,
        content: result.data,
      });
    }

    res.send(httpStatus.OK).send({
      result,
    });
  }
);

export default {
  GetAiChatMessage,
  UpdateAiChatMessage,
  DeleteAiChatMessage,
  ListAiChatMessages,
  runRagPipeline,
};
