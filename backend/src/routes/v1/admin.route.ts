import { Router } from "express";
import { auth, validate } from "@/middleware/index.ts";
import { adminValidations } from "@/validations/index.js";
import { adminController } from "@/controllers/index.js";
import { adminRoles } from "@/lib/permissions.ts";

const router: Router = Router();

const userRoutes: Router = Router({ mergeParams: true });

userRoutes
  .route("/")
  .patch(
    auth([...adminRoles], { user: ["create"] }),
    validate(adminValidations.UpdateUserRequestSchema),
    adminController.updateUser
  )
  .delete(
    auth([...adminRoles], { user: ["delete"] }),
    validate(adminValidations.RemoveUserRequestSchema),
    adminController.removeUser
  );

userRoutes.patch(
  "/role",
  auth([...adminRoles], { user: ["set-role"] }),
  validate(adminValidations.SetUserRoleRequestSchema),
  adminController.setUserRole
);

userRoutes.patch(
  "/password",
  auth([...adminRoles], { user: ["set-password"] }),
  validate(adminValidations.SetUserPasswordRequestSchema),
  adminController.setUserPassword
);

userRoutes.patch(
  "/ban",
  auth([...adminRoles], { user: ["ban"] }),
  validate(adminValidations.BanUserRequestSchema),
  adminController.banUser
);

userRoutes.patch(
  "/unban",
  auth([...adminRoles], { user: ["ban"] }),
  validate(adminValidations.UnbanUserRequestSchema),
  adminController.unbanUser
);

userRoutes.get(
  "/sessions",
  auth([...adminRoles], { session: ["list"] }),
  validate(adminValidations.ListUserSessionsRequestSchema),
  adminController.listUserSession
);

userRoutes.delete(
  "/sessions",
  auth([...adminRoles], { session: ["revoke"] }),
  validate(adminValidations.RevokeAllUserSessionRequestSchema),
  adminController.revokeAllUserSessions
);

userRoutes.delete(
  "/sessions/:sessionToken",
  auth([...adminRoles], { session: ["revoke"] }),
  validate(adminValidations.RevokeUserSessionRequestSchema),
  adminController.revokeUserSession
);

userRoutes.post(
  "/impersonate",
  auth([...adminRoles], { user: ["impersonate"] }),
  validate(adminValidations.ImpersonateUserRequestSchema),
  adminController.impersonateUser
);

userRoutes.delete(
  "/impersonate",
  auth([...adminRoles], { user: ["impersonate"] }),
  validate(adminValidations.StopImpersonatingRequestSchema),
  adminController.stopImpersonatingUser
);

router.use("/users/:userId", userRoutes);

router
  .route("/users")
  .get(
    auth([...adminRoles], { user: ["list"] }),
    validate(adminValidations.ListUserRequestSchema),
    adminController.listUsers
  )
  .post(
    auth([...adminRoles], { user: ["create"] }),
    validate(adminValidations.CreateUserRequestSchema),
    adminController.createUser
  );

export default router;
