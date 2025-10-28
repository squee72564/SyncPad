import type { NextFunction, Request, RequestHandler, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import httpStatus from "http-status";

import auth from "../lib/auth.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";
import { SessionWithImpersonatedBy, UserWithRole } from "better-auth/plugins";

interface PermissionCheck {
  [resource: string]: string[];
}

const authMiddleware: (allowedRoles?: string[], permissions?: PermissionCheck) => RequestHandler = (
  allowedRoles,
  permissions
) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const headers = fromNodeHeaders(req.headers);
    const result = await auth.api.getSession({
      headers: headers,
    });

    if (!result) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const { session, user } = result;
    req.session = session as SessionWithImpersonatedBy;
    req.user = user as UserWithRole;

    const isSuperAdmin = user.role === "superAdmin";

    if (isSuperAdmin) {
      return next();
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const roles = user.role ? user.role.split(",") : [];
      const hasAllowedRole = roles.some((r) => allowedRoles.includes(r.trim()));
      if (!hasAllowedRole) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: insufficient role");
      }
    }

    if (permissions) {
      const permResult = await auth.api.userHasPermission({
        body: {
          userId: user.id,
          permissions: permissions,
        },
      });

      if (!permResult.success) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: insufficient permission");
      }
    }

    next();
  });

export default authMiddleware;
