import type { NextFunction, Response } from "express";
import httpStatus from "http-status";

import catchAsync from "@/utils/catchAsync.js";
import ApiError from "@/utils/ApiError.js";
import documentService from "@/services/document.service.js";
import activityLogService from "@/services/activity-log.service.js";
import {
  type CreateDocumentRequest,
  type DeleteDocumentRequest,
  type GetDocumentRequest,
  type ListDocumentsRequest,
  type UpdateDocumentRequest,
  type UpdateDocumentCollabStateRequest,
} from "@/types/document.types.ts";

// Return all documents in a workspace, optionally filtered by parent/status, respecting permission scope.
const listDocuments = catchAsync(
  async (req: ListDocumentsRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const result = await documentService.listDocuments(
      context.workspace.id,
      req.query ?? undefined
    );

    res.status(httpStatus.OK).json({
      data: result.documents,
      nextCursor: result.nextCursor,
    });
  }
);

// Create a new workspace-scoped document using the authenticated user as author.
const createDocument = catchAsync(
  async (req: CreateDocumentRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const document = await documentService.createDocument(context.workspace.id, userId, req.body);

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "document.created",
      documentId: document.id,
      metadata: {
        title: document.title,
        status: document.status,
      },
      actorId: userId,
    });

    res.status(httpStatus.CREATED).json({ document });
  }
);

// Fetch a single document within the resolved workspace context.
const getDocument = catchAsync(
  async (req: GetDocumentRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const document = await documentService.getDocumentById(
      context.workspace.id,
      req.params.documentId
    );

    if (!document) {
      throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
    }

    const includeCollab =
      req.query?.includeCollabState === true || req.query?.includeCollabState === "true";

    const payload: Record<string, unknown> = { document };

    if (includeCollab) {
      payload.collabState = await documentService.getDocumentCollabState(
        context.workspace.id,
        document.id
      );
    }

    res.status(httpStatus.OK).json(payload);
  }
);

// Update document metadata/content with guards for publish permission escalation.
const updateDocument = catchAsync(
  async (req: UpdateDocumentRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const updates = req.body;

    if (
      updates.status === "PUBLISHED" &&
      !context.permissions.includes("document:publish") &&
      context.effectiveRole !== "SUPERADMIN"
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: missing document publish permission");
    }

    const document = await documentService.updateDocument(
      context.workspace.id,
      req.params.documentId,
      updates,
      userId
    );

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "document.updated",
      documentId: document.id,
      metadata: {
        updatedFields: Object.keys(updates),
        status: document.status,
      },
      actorId: userId,
    });

    res.status(httpStatus.OK).json({ document });
  }
);

// Remove a document after verifying workspace context and existence.
const deleteDocument = catchAsync(
  async (req: DeleteDocumentRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    await documentService.deleteDocument(context.workspace.id, req.params.documentId);

    await activityLogService.createActivityLog(context.workspace.id, {
      event: "document.deleted",
      documentId: req.params.documentId,
      actorId: req.user?.id ?? null,
    });

    res.status(httpStatus.NO_CONTENT).send();
  }
);

const saveDocumentCollabState = catchAsync(
  async (req: UpdateDocumentCollabStateRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const document = await documentService.getDocumentById(
      context.workspace.id,
      req.params.documentId
    );

    if (!document) {
      throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
    }

    if (document.status !== "DRAFT") {
      throw new ApiError(httpStatus.FORBIDDEN, "Only draft documents can be edited");
    }

    const collabState = await documentService.upsertDocumentCollabState(
      context.workspace.id,
      document.id,
      req.body.snapshot,
      req.body.version
    );

    // await activityLogService.createActivityLog(context.workspace.id, {
    //   event: "document.collab-saved",
    //   documentId: document.id,
    //   actorId: req.user.id,
    //   metadata: {
    //     version: collabState.version,
    //   },
    // });

    res.status(httpStatus.OK).json({ collabState });
  }
);

export default {
  listDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  saveDocumentCollabState,
};
