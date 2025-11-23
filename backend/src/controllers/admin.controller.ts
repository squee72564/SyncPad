import type { NextFunction, Response } from "express";
import httpStatus from "http-status";

import catchAsync from "@/utils/catchAsync.js";
import { adminService, userService } from "@/services/index.js";

import {
  BanUserRequest,
  CreateUserRequest,
  ImpersonateUserRequest,
  ListUserRequest,
  ListUserSessionsRequest,
  RemoveUserRequest,
  RevokeAllUserSessionRequest,
  RevokeUserSessionRequest,
  SetUserPasswordRequest,
  SetUserRoleRequest,
  StopImpersonatingRequest,
  UnbanUserRequest,
  UpdateUserRequest,
} from "@/types/admin.types.js";
import ApiError from "@/utils/ApiError.ts";

const createUser = catchAsync(
  async (req: CreateUserRequest, res: Response, _next: NextFunction) => {
    const args = { ...req.body };

    const user = await adminService.createUser(args, req);
    res.status(httpStatus.OK).json(user);
  }
);

const listUsers = catchAsync(async (req: ListUserRequest, res: Response) => {
  const args = { ...req.query };

  const users = await adminService.listUsers(args, req);
  res.status(httpStatus.OK).json(users);
});

const setUserRole = catchAsync(async (req: SetUserRoleRequest, res: Response) => {
  const args = { ...req.body, ...req.params };

  const user = await userService.getPublicUserById(args.userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User is not found.");
  }

  if (req.user?.role === "admin" && user.role === "superAdmin") {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: insufficient role");
  }

  const updatedUser = await adminService.setUserRole(args, req);
  res.status(httpStatus.OK).json(updatedUser);
});

const setUserPassword = catchAsync(async (req: SetUserPasswordRequest, res: Response) => {
  const args = { ...req.params, ...req.body };

  const user = await adminService.setUserPassword(args, req);
  res.status(httpStatus.OK).json(user);
});

const updateUser = catchAsync(async (req: UpdateUserRequest, res: Response) => {
  const args = { ...req.params, ...req.body };

  const user = await adminService.updateUser(args, req);
  res.status(httpStatus.OK).json(user);
});

const banUser = catchAsync(async (req: BanUserRequest, res: Response) => {
  const args = { ...req.params, ...req.body };

  const user = await adminService.banUser(args, req);
  res.status(httpStatus.OK).json(user);
});

const unbanUser = catchAsync(async (req: UnbanUserRequest, res: Response) => {
  const args = { ...req.params };

  const user = await adminService.unbanUser(args, req);
  res.status(httpStatus.OK).json(user);
});

const listUserSession = catchAsync(async (req: ListUserSessionsRequest, res: Response) => {
  const args = { ...req.params };

  const session = await adminService.listUserSessions(args, req);
  res.status(httpStatus.OK).json(session);
});

const revokeUserSession = catchAsync(async (req: RevokeUserSessionRequest, res: Response) => {
  const args = { ...req.params };

  const success = await adminService.revokeUserSession(args, req);
  res.status(httpStatus.OK).json(success);
});

const revokeAllUserSessions = catchAsync(
  async (req: RevokeAllUserSessionRequest, res: Response) => {
    const args = { ...req.params };

    const success = await adminService.revokeAllUserSessions(args, req);
    res.status(httpStatus.OK).json(success);
  }
);

const impersonateUser = catchAsync(async (req: ImpersonateUserRequest, res: Response) => {
  const args = { ...req.params };

  const user = await adminService.impersonateUser(args, req);
  res.status(httpStatus.OK).json(user);
});

const stopImpersonatingUser = catchAsync(async (req: StopImpersonatingRequest, res: Response) => {
  const user = await adminService.stopImpersonatingUser(req);
  res.status(httpStatus.OK).json(user);
});

const removeUser = catchAsync(async (req: RemoveUserRequest, res: Response) => {
  const args = { ...req.params };

  const success = await adminService.removeUser(args, req);
  res.status(httpStatus.OK).json(success);
});

export default {
  createUser,
  listUsers,
  setUserRole,
  setUserPassword,
  updateUser,
  banUser,
  unbanUser,
  listUserSession,
  revokeUserSession,
  revokeAllUserSessions,
  impersonateUser,
  stopImpersonatingUser,
  removeUser,
};
