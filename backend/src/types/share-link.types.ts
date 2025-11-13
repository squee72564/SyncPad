import { SharePermission } from "../../prisma/generated/prisma-postgres/index.js";
import { ZodRequest } from "../utils/zodReqeust.ts";
import shareLinkValidations from "@/validations/share-link.validations.js";

export type ListShareLinksRequest = ZodRequest<
  typeof shareLinkValidations.ListShareLinksRequestSchema
>;
export type ListShareLinksArgs = ListShareLinksRequest["params"];

export type CreateShareLinkRequest = ZodRequest<
  typeof shareLinkValidations.CreateShareLinkRequestSchema
>;
export type CreateShareLinkArgs = CreateShareLinkRequest["params"] & CreateShareLinkRequest["body"];

export type UpdateShareLinkRequest = ZodRequest<
  typeof shareLinkValidations.UpdateShareLinkRequestSchema
>;
export type UpdateShareLinkArgs = UpdateShareLinkRequest["params"] & UpdateShareLinkRequest["body"];

export type DeleteShareLinkRequest = ZodRequest<
  typeof shareLinkValidations.DeleteShareLinkRequestSchema
>;
export type DeleteShareLinkArgs = DeleteShareLinkRequest["params"];

export type ShareLinkTokenRequest = ZodRequest<
  typeof shareLinkValidations.ShareLinkTokenRequestSchema
>;
export type ShareLinkTokenArgs = ShareLinkTokenRequest["params"];

export type ShareLinkPermission = SharePermission;
