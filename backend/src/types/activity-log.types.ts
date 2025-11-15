import { ZodRequest } from "../utils/zodReqeust.ts";
import activityLogValidations from "@/validations/activity-log.validations.js";

export type CreateActivityLogRequest = ZodRequest<
  typeof activityLogValidations.CreateActivityLogRequestSchema
>;
export type CreateActivityLogArgs = CreateActivityLogRequest["params"] &
  CreateActivityLogRequest["body"] & { actorId?: string | null };

export type DeleteActivityLogRequest = ZodRequest<
  typeof activityLogValidations.DeleteActivityLogRequestSchema
>;
export type DeleteActivityLogArgs = DeleteActivityLogRequest["params"];

export type ListActivityLogsRequest = ZodRequest<
  typeof activityLogValidations.ListActivityLogsRequestSchema
>;
export type ListActivityLogsArgs = ListActivityLogsRequest["params"] &
  Partial<NonNullable<ListActivityLogsRequest["query"]>>;
