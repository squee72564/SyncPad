import { Router } from "express";

import auth from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { attachWorkspaceContext, requireWorkspacePermission } from "../../middleware/workspace.js";
import { documentController } from "../../controllers/index.js";
import { documentValidations } from "../../validations/index.js";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";

const router: Router = Router({ mergeParams: true });

router
  .route("/")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(documentValidations.ListDocumentsRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:read"),
    documentController.listDocuments
  )
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(documentValidations.CreateDocumentRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:create"),
    documentController.createDocument
  );

router
  .route("/:documentId")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(documentValidations.GetDocumentRequestSchema),
    attachWorkspaceContext({ allowShareLinks: true, requireMembership: false }),
    requireWorkspacePermission("document:read"),
    documentController.getDocument
  )
  .patch(
    auth([...defaultRoles, ...adminRoles]),
    validate(documentValidations.UpdateDocumentRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:update"),
    documentController.updateDocument
  )
  .delete(
    auth([...defaultRoles, ...adminRoles]),
    validate(documentValidations.DeleteDocumentRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("document:delete"),
    documentController.deleteDocument
  );

router.patch(
  "/:documentId/collab-state",
  auth([...defaultRoles, ...adminRoles]),
  validate(documentValidations.UpdateDocumentCollabStateRequestSchema),
  attachWorkspaceContext(),
  requireWorkspacePermission("document:update"),
  documentController.saveDocumentCollabState
);

export default router;
