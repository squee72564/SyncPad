import express, { type Router } from "express";
import { userController } from "../../controllers/index.js";
import { userValidations } from "../../validations/index.js";
import validate from "../../middleware/validate.js";
import auth from "../../middleware/auth.js";

import { defaultRoles, adminRoles } from "@/lib/permissions.ts";

const router: Router = express.Router();

router
  .route("/self")
  .get(
    auth([...defaultRoles, ...adminRoles]),
    validate(userValidations.getUserWithSession),
    userController.getUserWithSession
  );

router
  .route("/:id")
  .get(
    auth([...defaultRoles, ...adminRoles], { publicUser: ["listPublicUsers"] }),
    validate(userValidations.getUserById),
    userController.getPublicUserById
  );

router
  .route("/")
  .get(
    auth([...defaultRoles, ...adminRoles], { publicUser: ["listPublicUsers"] }),
    validate(userValidations.listPublicUsers),
    userController.listPublicUsers
  );

export default router;
