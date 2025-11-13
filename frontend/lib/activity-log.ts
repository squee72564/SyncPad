"use server";

import { authorizedFetch } from "./api-client";

export type CreateActivityLogPayload = {
  event: string;
  documentId?: string;
  actorId?: string;
  metadata: Object;
};

export type CreateActivityLogRecord = {
  workspaceId: string;
  event: string;
  documentId: string | null;
  actorId: string | null;
  metadata: Object;
  id: string;
  createdAt: Date;
};

export type CreateActivityLogResponse = {
  activityLog: CreateActivityLogRecord;
}

export const createActivityLog = async (
  workspaceId: string,
  payload: CreateActivityLogPayload,
): Promise<CreateActivityLogRecord> => {
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
  activityLogId: string,
): Promise<void> => {
  await authorizedFetch(`/v1/workspaces/${workspaceId}/activity-logs/${activityLogId}`, {
    method: "DELETE"
  });
};

