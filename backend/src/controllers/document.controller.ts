import type { NextFunction, Response } from "express";
import httpStatus from "http-status";

import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";
import documentService from "../services/document.service.js";
import {
  type CreateDocumentArgs,
  type CreateDocumentRequest,
  type DeleteDocumentParams,
  type DeleteDocumentRequest,
  type GetDocumentParams,
  type GetDocumentRequest,
  type ListDocumentsRequest,
  type UpdateDocumentParams,
  type UpdateDocumentRequest,
} from "../types/document.ts";

// Return all documents in a workspace, optionally filtered by parent/status, respecting permission scope.
const listDocuments = catchAsync(
  async (req: ListDocumentsRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    const documents = await documentService.listDocuments(
      context.workspace.id,
      req.query ?? undefined
    );

    res.status(httpStatus.OK).json({ documents });
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

    res.status(httpStatus.OK).json({ document });
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
      updates
    );

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

    res.status(httpStatus.NO_CONTENT).send();
  }
);

export default {
  listDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
};
