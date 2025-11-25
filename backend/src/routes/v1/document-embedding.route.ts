import { Router } from "express";

import { auth, validate, attachWorkspaceContext } from "@/middleware/index.ts";

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
    documentEmbeddingController.listDocumentEmbeddings
  );
