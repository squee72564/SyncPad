import { Router } from "express";

import {
  auth,
  validate,
  attachWorkspaceContext,
  requireWorkspacePermission,
} from "@/middleware/index.js";
import { shareLinkController } from "@/controllers/index.js";
import { shareLinkValidations } from "@/validations/index.js";
import { adminRoles, defaultRoles } from "@/lib/permissions.ts";

const router: Router = Router({ mergeParams: true });

router
  .route("/")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(shareLinkValidations.ListShareLinksRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("share:manage"),
    shareLinkController.listShareLinks
  )
  .post(
    auth([...defaultRoles, ...adminRoles]),
    validate(shareLinkValidations.CreateShareLinkRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("share:manage"),
    shareLinkController.createShareLink
  );

router
  .route("/:shareLinkId")
  .patch(
    auth([...defaultRoles, ...adminRoles]),
    validate(shareLinkValidations.UpdateShareLinkRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("share:manage"),
    shareLinkController.updateShareLink
  )
  .delete(
    auth([...defaultRoles, ...adminRoles]),
    validate(shareLinkValidations.DeleteShareLinkRequestSchema),
    attachWorkspaceContext(),
    requireWorkspacePermission("share:manage"),
    shareLinkController.deleteShareLink
  );

export default router;
