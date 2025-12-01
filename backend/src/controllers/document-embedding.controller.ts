import type { NextFunction, Response } from "express";
import httpStatus from "http-status";

import catchAsync from "@/utils/catchAsync.js";
import ApiError from "@/utils/ApiError.js";
import { documentEmbeddingService } from "@/services/index.js";
import {
  ListDocumentEmbeddingsRequest,
  ListDocumentEmbeddingParams,
  ListDocumentEmbeddingQuery,
  SimilarDocumentEmbeddingsParams,
  SimilarDocumentEmbeddingsQuery,
  SimilarDocumentEmbeddingsRequest,
} from "@/types/document-embedding.types.ts";

const listDocumentEmbeddings = catchAsync(
  async (req: ListDocumentEmbeddingsRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await documentEmbeddingService.listDocumentEmbeddings({
      ...(req.params as ListDocumentEmbeddingParams),
      ...(req.query as ListDocumentEmbeddingQuery),
    });

    res.status(httpStatus.OK).json({
      data: result.documentEmbeddings,
      nextCursor: result.nextCursor,
    });
  }
);

const findSimilarDocuments = catchAsync(
  async (req: SimilarDocumentEmbeddingsRequest, res: Response, _next: NextFunction) => {
    const context = req.workspaceContext;

    if (!context) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Workspace context not found");
    }

    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await documentEmbeddingService.findSimilarDocuments({
      ...(req.params as SimilarDocumentEmbeddingsParams),
      ...(req.query as SimilarDocumentEmbeddingsQuery),
    });

    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, "Document embeddings not found");
    }

    res.status(httpStatus.OK).json({
      data: result.similarDocuments,
    });
  }
);

export default {
  listDocumentEmbeddings,
  findSimilarDocuments,
};
