import type { Response, NextFunction } from "express";
import httpStatus from "http-status";

import { aiChatThreadService } from "@/services/index.ts";
import {
  GetAiChatThreadRequest,
  DeleteAiChatThreadRequest,
  EditAiChatThreadRequest,
  CreateAiChatThreadRequest,
  ListAiChatThreadRequest,
} from "@/types/ai-chat-thread.types.ts";
import ApiError from "@/utils/ApiError.js";
import catchAsync from "@/utils/catchAsync.js";

const CreateAiChatThread = catchAsync(
  async (req: CreateAiChatThreadRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await aiChatThreadService.createAiChatThread(
      {
        workspaceId: context.workspace.id,
        title: req.body.title,
      },
      req.user.id
    );

    res.status(httpStatus.CREATED).json(result);
  }
);

const GetAiChatThread = catchAsync(
  async (req: GetAiChatThreadRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await aiChatThreadService.getAiChatThread({
      workspaceId: context.workspace.id,
      threadId: req.params.threadId,
    });

    res.status(httpStatus.OK).json(result);
  }
);

const EditAiChatThread = catchAsync(
  async (req: EditAiChatThreadRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await aiChatThreadService.updateAiChatThread({
      workspaceId: context.workspace.id,
      threadId: req.params.threadId,
      title: req.body.title,
    });

    res.status(httpStatus.OK).json(result);
  }
);

const DeleteAiChatThread = catchAsync(
  async (req: DeleteAiChatThreadRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    await aiChatThreadService.deleteAiChatThread({
      workspaceId: context.workspace.id,
      threadId: req.params.threadId,
    });

    res.sendStatus(httpStatus.NO_CONTENT);
  }
);

const ListAiChatThreads = catchAsync(
  async (req: ListAiChatThreadRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await aiChatThreadService.listAiChatThreads({
      workspaceId: context.workspace.id,
      ...req.query,
    });

    res.status(httpStatus.OK).json({
      data: result.threads,
      nextCursor: result.nextCursor,
    });
  }
);

export default {
  CreateAiChatThread,
  GetAiChatThread,
  EditAiChatThread,
  DeleteAiChatThread,
  ListAiChatThreads,
};
