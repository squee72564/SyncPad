import { z } from "zod";
import { roles as definedRoles } from "@/lib/permissions.js";

const RoleSchema = z.union([z.enum(definedRoles), z.array(z.enum(definedRoles))]);

// Userid within params
const WithUserParam = {
  params: z.object({
    userId: z.string(),
  }),
};

// Create use
const CreateUserRequestSchema = z.object({
  body: z.object({
    email: z.string(),
    password: z.string(),
    name: z.string(),
    role: RoleSchema,
    data: z.record(z.string(), z.unknown()),
  }),
});

// List Users
const ListUserRequestSchema = z.object({
  query: z.object({
    searchValue: z.string().optional(),
    searchField: z.enum(["email", "name"]).optional(),
    searchOperator: z.enum(["contains", "starts_with", "ends_with"]).optional(),
    limit: z.union([z.string(), z.number()]).optional(),
    offset: z.union([z.string(), z.number()]).optional(),
    sortBy: z.string().optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
    filterField: z.string().optional(),
    filterValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    filterOperator: z.enum(["eq", "ne", "lt", "lte", "gt", "gte"]).optional(),
  }),
});

// Set User Role
const SetUserRoleRequestSchema = z.object({
  ...WithUserParam,
  body: z.object({
    role: RoleSchema,
  }),
});

// Set User Password
const SetUserPasswordRequestSchema = z.object({
  ...WithUserParam,

  body: z.object({
    newPassword: z.string(),
  }),
});

// Update User
const UpdateUserRequestSchema = z.object({
  ...WithUserParam,
  body: z.object({
    data: z.record(z.string(), z.unknown()),
  }),
});

// Ban User
const BanUserRequestSchema = z.object({
  ...WithUserParam,

  body: z.object({
    banReason: z.string().optional(),
    banExpiresIn: z.number().optional(),
  }),
});

// Unban user
const UnbanUserRequestSchema = z.object({
  ...WithUserParam,
});

// List User Sessions
const ListUserSessionsRequestSchema = z.object({
  ...WithUserParam,
});

// Revoke User Session
const RevokeUserSessionRequestSchema = z.object({
  params: z.object({
    userId: z.string(),
    sessionToken: z.string(),
  }),
});

// Revoke All Session for User
const RevokeAllUserSessionRequestSchema = z.object({
  ...WithUserParam,
});

// Impersonate User
const ImpersonateUserRequestSchema = z.object({
  ...WithUserParam,
});

// Stop Impersonating User
const StopImpersonatingRequestSchema = z.object({});

// Remove User
const RemoveUserRequestSchema = z.object({
  ...WithUserParam,
});

export default {
  CreateUserRequestSchema,
  RemoveUserRequestSchema,
  UpdateUserRequestSchema,
  ListUserRequestSchema,
  SetUserRoleRequestSchema,
  ImpersonateUserRequestSchema,
  ListUserSessionsRequestSchema,
  StopImpersonatingRequestSchema,
  RevokeUserSessionRequestSchema,
  RevokeAllUserSessionRequestSchema,
  SetUserPasswordRequestSchema,
  BanUserRequestSchema,
  UnbanUserRequestSchema,
};
