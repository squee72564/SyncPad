import { Router } from "express";

import validate from "../../middleware/validate.js";
import { shareLinkValidations } from "../../validations/index.js";
import { shareLinkController } from "../../controllers/index.js";

const router: Router = Router();

router
  .route("/:token")
  .get(
    validate(shareLinkValidations.ShareLinkTokenRequestSchema),
    shareLinkController.previewShareLink
  );

export default router;
