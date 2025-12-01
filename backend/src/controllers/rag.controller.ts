import type { Response, NextFunction } from "express";
import httpStatus from "http-status";

import logger from "@/config/logger.ts";
import { ragService } from "@/services/index.ts";
import ApiError from "@/utils/ApiError.js";
import catchAsync from "@/utils/catchAsync.js";
import { RunRagPipelineRequest } from "@/types/rag.types.ts";

const runRagPipeline = catchAsync(
  async (req: RunRagPipelineRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const { workspaceId } = req.params;
    const { query, history } = req.body;
    const startedAt = Date.now();

    const result = await ragService.runPipeline(workspaceId, query, history);
    const latencyMs = Date.now() - startedAt;

    logger.info("RAG pipeline executed", {
      workspaceId,
      userId: req.user.id,
      success: result.success,
      latencyMs,
    });

    if (result.success) {
      return res.status(httpStatus.OK).json({ response: result.data });
    }

    if (result.type === "InputGuardrail") {
      return res.status(httpStatus.BAD_REQUEST).json({
        type: "InputGuardrail",
        data: result.data,
      });
    }

    return res.status(httpStatus.BAD_GATEWAY).json({
      type: "Agent",
      error: result.error ?? "RAG pipeline failed",
    });
  }
);

export default {
  runRagPipeline,
};
