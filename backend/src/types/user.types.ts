import { ZodRequest } from "@/utils/zodReqeust.ts";
import userValidations from "@/validations/user.validations.ts";

export type GetUserWithSessionRequest = ZodRequest<typeof userValidations.getUserWithSession>;

export type GetUserRequest = ZodRequest<typeof userValidations.getUserById>;
export type GetUserArgs = GetUserRequest["params"];

export type ListPublicUsersRequest = ZodRequest<typeof userValidations.listPublicUsers>;
export type ListPublicUsersArgs = ListPublicUsersRequest["query"];
