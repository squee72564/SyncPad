import { Router } from "express";

import {
  auth,
  validate,
  attachWorkspaceContext,
  requireWorkspacePermission,
} from "@/middleware/index.ts";

import { documentEmbeddingController } from "@/controllers/index.js";
import { documentEmbeddingValidations } from "@/validations/index.js";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";

const router: Router = Router({ mergeParams: true });

router
  .route("/")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(documentEmbeddingValidations.ListDocumentEmbeddingsRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    documentEmbeddingController.listDocumentEmbeddings
  );

router
  .route("/:documentId/similar")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(documentEmbeddingValidations.SimilarDocumentEmbeddingsRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    documentEmbeddingController.findSimilarDocuments
  );

export default router;
