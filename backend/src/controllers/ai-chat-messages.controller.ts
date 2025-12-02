import type { Response, NextFunction } from "express";
import httpStatus from "http-status";

import logger from "@/config/logger.ts";
import { ragService, aiChatMessageService } from "@/services/index.ts";
import ApiError from "@/utils/ApiError.js";
import catchAsync from "@/utils/catchAsync.js";
import { RunRagPipelineRequest } from "@/types/ai-chat-messages.types.ts";

const runRagPipeline = catchAsync(
  async (req: RunRagPipelineRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const { workspaceId, threadId } = req.params;
    const { query } = req.body;
    const startedAt = Date.now();

    const history = await aiChatMessageService.getRecentMessages(threadId, 5);

    const result = await ragService.runPipeline(workspaceId, query, history);
    const latencyMs = Date.now() - startedAt;

    logger.info("RAG pipeline executed", {
      workspaceId,
      userId: req.user.id,
      success: result.success,
      latency: `${latencyMs / 1000} seconds`,
    });

    if (result.success) {
      return res.status(httpStatus.OK).json({ success: true, response: result.data });
    }

    if (result.type === "InputGuardrail") {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        type: "InputGuardrail",
        error: "Gaurdrails failed",
      });
    }

    return res.status(httpStatus.BAD_GATEWAY).json({
      success: false,
      type: "Agent",
      error: result.error ?? "RAG pipeline failed",
    });
  }
);

const getConversationHistory = catchAsync(
  async (req: RunRagPipelineRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const history = await aiChatMessageService.getConversationHistory(req.params.threadId);

    res.status(httpStatus.OK).json({
      history: history,
    });
  }
);

export default {
  runRagPipeline,
  getConversationHistory,
};
