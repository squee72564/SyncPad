"use server";

import { authorizedFetch } from "./api-client";
import type { PaginatedResult } from "./types";

export type CreateActivityLogPayload = {
  event: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
};

export type ActivityLogActor = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type ActivityLogDocument = {
  id: string;
  title: string | null;
  slug: string | null;
  status: string | null;
};

export type ActivityLogRecord = {
  id: string;
  workspaceId: string;
  event: string;
  documentId: string | null;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: ActivityLogActor | null;
  document: ActivityLogDocument | null;
};

export type CreateActivityLogResponse = {
  activityLog: ActivityLogRecord;
};

export const createActivityLog = async (
  workspaceId: string,
  payload: CreateActivityLogPayload
): Promise<ActivityLogRecord> => {
  const response = await authorizedFetch(`/v1/workspaces/${workspaceId}/activity-logs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as CreateActivityLogResponse;
  return data.activityLog;
};

export const deleteActivityLog = async (
  workspaceId: string,
  activityLogId: string
): Promise<void> => {
  await authorizedFetch(`/v1/workspaces/${workspaceId}/activity-logs/${activityLogId}`, {
    method: "DELETE",
  });
};

export type ListActivityLogsParams = {
  cursor?: string;
  limit?: number;
  documentId?: string;
  actorId?: string;
  event?: string;
};

export type ListActivityLogsResponse = PaginatedResult<ActivityLogRecord>;

export const listActivityLogs = async (
  workspaceId: string,
  params: ListActivityLogsParams = {}
): Promise<ListActivityLogsResponse> => {
  const query = new URLSearchParams();

  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.documentId) query.set("documentId", params.documentId);
  if (params.actorId) query.set("actorId", params.actorId);
  if (params.event) query.set("event", params.event);

  const search = query.toString();

  const response = await authorizedFetch(
    `/v1/workspaces/${workspaceId}/activity-logs${search ? `?${search}` : ""}`
  );

  return (await response.json()) as ListActivityLogsResponse;
};
