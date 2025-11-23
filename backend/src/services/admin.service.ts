// SEE: https://www.better-auth.com/docs/plugins/admin

import auth from "@/lib/auth.ts";
import {
  CreateUserArgs,
  ListUserArgs,
  SetUserRoleArgs,
  SetUserPasswordArgs,
  UpdateUserArgs,
  BanUserArgs,
  UnbanUserArgs,
  ListUserSessionsArgs,
  RevokeUserSessionArgs,
  RevokeAllUserSessionArgs,
  ImpersonateUserArgs,
  RemoveUserArgs,
  ListUserRequest,
  CreateUserRequest,
  SetUserRoleRequest,
  SetUserPasswordRequest,
  UpdateUserRequest,
  BanUserRequest,
  UnbanUserRequest,
  ListUserSessionsRequest,
  StopImpersonatingRequest,
  RemoveUserRequest,
  ImpersonateUserRequest,
  RevokeAllUserSessionRequest,
  RevokeUserSessionRequest,
} from "@/types/admin.types.js";

const createUser = async (args: CreateUserArgs, req: CreateUserRequest) => {
  return auth.api.createUser({
    body: {
      email: args.email,
      password: args.password,
      name: args.name,
      role: args.role,
      data: args.data,
    },
    headers: req.headers,
  });
};

// List Users
const listUsers = async (args: ListUserArgs, req: ListUserRequest) => {
  return auth.api.listUsers({
    query: {
      searchValue: args.searchValue,
      searchField: args.searchField,
      searchOperator: args.searchOperator,
      limit: args.limit,
      offset: args.offset,
      sortBy: args.sortBy,
      sortDirection: args.sortDirection,
      filterField: args.filterField,
      filterValue: args.filterValue,
      filterOperator: args.filterOperator,
    },
    headers: req.headers,
  });
};

// Set User Role

const setUserRole = async (args: SetUserRoleArgs, req: SetUserRoleRequest) => {
  return auth.api.setRole({
    body: {
      userId: args.userId,
      role: args.role,
    },
    headers: req.headers,
  });
};

// Set User Password

const setUserPassword = async (args: SetUserPasswordArgs, req: SetUserPasswordRequest) => {
  return auth.api.setUserPassword({
    body: {
      userId: args.userId,
      newPassword: args.newPassword,
    },
    headers: req.headers,
  });
};

// Update User
const updateUser = async (args: UpdateUserArgs, req: UpdateUserRequest) => {
  return auth.api.adminUpdateUser({
    body: {
      userId: args.userId,
      data: args.data,
    },
    headers: req.headers,
  });
};

// Ban User
const banUser = async (args: BanUserArgs, req: BanUserRequest) => {
  return auth.api.banUser({
    body: {
      userId: args.userId,
      banReason: args.banReason,
      banExpiresIn: args.banExpiresIn,
    },
    headers: req.headers,
  });
};

// Unban User

const unbanUser = async (args: UnbanUserArgs, req: UnbanUserRequest) => {
  return auth.api.unbanUser({
    body: {
      userId: args.userId,
    },
    headers: req.headers,
  });
};

// List User Sessions
const listUserSessions = async (args: ListUserSessionsArgs, req: ListUserSessionsRequest) => {
  return auth.api.listUserSessions({
    body: {
      userId: args.userId,
    },
    headers: req.headers,
  });
};

// Revoke User Session
const revokeUserSession = async (args: RevokeUserSessionArgs, req: RevokeUserSessionRequest) => {
  return auth.api.revokeUserSession({
    body: {
      sessionToken: args.sessionToken,
    },
    headers: req.headers,
  });
};

// Revoke All Session for User
const revokeAllUserSessions = async (
  args: RevokeAllUserSessionArgs,
  req: RevokeAllUserSessionRequest
) => {
  return auth.api.revokeUserSessions({
    body: {
      userId: args.userId,
    },
    headers: req.headers,
  });
};

// Impersonate User
const impersonateUser = async (args: ImpersonateUserArgs, req: ImpersonateUserRequest) => {
  return auth.api.impersonateUser({
    body: {
      userId: args.userId,
    },
    headers: req.headers,
  });
};

// Stop Impersonating User
const stopImpersonatingUser = async (req: StopImpersonatingRequest) => {
  return auth.api.stopImpersonating({
    headers: req.headers,
  });
};

// Remove User
const removeUser = async (args: RemoveUserArgs, req: RemoveUserRequest) => {
  return auth.api.removeUser({
    body: {
      userId: args.userId,
    },
    headers: req.headers,
  });
};

export default {
  createUser,
  listUsers,
  setUserRole,
  setUserPassword,
  updateUser,
  banUser,
  unbanUser,
  listUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
  impersonateUser,
  stopImpersonatingUser,
  removeUser,
};
