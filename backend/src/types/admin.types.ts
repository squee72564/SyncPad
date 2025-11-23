import { ZodRequest } from "@/utils/zodReqeust.ts";
import adminValidations from "@/validations/admin.validations.js";

export type CreateUserRequest = ZodRequest<typeof adminValidations.CreateUserRequestSchema>;
export type CreateUserArgs = CreateUserRequest["body"];

export type ListUserRequest = ZodRequest<typeof adminValidations.ListUserRequestSchema>;
export type ListUserArgs = ListUserRequest["query"];

export type SetUserRoleRequest = ZodRequest<typeof adminValidations.SetUserRoleRequestSchema>;
export type SetUserRoleArgs = SetUserRoleRequest["params"] & SetUserRoleRequest["body"];

export type SetUserPasswordRequest = ZodRequest<
  typeof adminValidations.SetUserPasswordRequestSchema
>;
export type SetUserPasswordArgs = SetUserPasswordRequest["params"] & SetUserPasswordRequest["body"];

export type UpdateUserRequest = ZodRequest<typeof adminValidations.UpdateUserRequestSchema>;
export type UpdateUserArgs = UpdateUserRequest["params"] & UpdateUserRequest["body"];

export type BanUserRequest = ZodRequest<typeof adminValidations.BanUserRequestSchema>;
export type BanUserArgs = BanUserRequest["params"] & BanUserRequest["body"];

export type UnbanUserRequest = ZodRequest<typeof adminValidations.UnbanUserRequestSchema>;
export type UnbanUserArgs = UnbanUserRequest["params"];

export type ListUserSessionsRequest = ZodRequest<
  typeof adminValidations.ListUserSessionsRequestSchema
>;
export type ListUserSessionsArgs = ListUserSessionsRequest["params"];

export type RevokeUserSessionRequest = ZodRequest<
  typeof adminValidations.RevokeUserSessionRequestSchema
>;
export type RevokeUserSessionArgs = RevokeUserSessionRequest["params"];

export type RevokeAllUserSessionRequest = ZodRequest<
  typeof adminValidations.RevokeAllUserSessionRequestSchema
>;
export type RevokeAllUserSessionArgs = RevokeAllUserSessionRequest["params"];

export type ImpersonateUserRequest = ZodRequest<
  typeof adminValidations.ImpersonateUserRequestSchema
>;
export type ImpersonateUserArgs = ImpersonateUserRequest["params"];

export type StopImpersonatingRequest = ZodRequest<
  typeof adminValidations.StopImpersonatingRequestSchema
>;
export type StopImpersonatingArgs = StopImpersonatingRequest["params"];

export type RemoveUserRequest = ZodRequest<typeof adminValidations.RemoveUserRequestSchema>;
export type RemoveUserArgs = RemoveUserRequest["params"];
