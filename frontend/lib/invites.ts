"use server";

import { authorizedFetch } from "./api-client";
import type { PaginatedResult } from "./types";

export type WorkspaceInviteRole = "ADMIN" | "EDITOR" | "COMMENTER" | "VIEWER";

export type WorkspaceInviteRecord = {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceInviteRole;
  invitedById: string | null;
  invitedBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  acceptUrl?: string;
};

type CreateInvitePayload = {
  email: string;
  role: WorkspaceInviteRole;
};

type InviteResponse = {
  invite: WorkspaceInviteRecord;
};

export type AcceptWorkspaceInviteResult = {
  workspaceId: string;
  acceptedAt: string;
  membership: {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
};

export async function getWorkspaceInvites(
  workspaceId: string
): Promise<PaginatedResult<WorkspaceInviteRecord>> {
  const response = await authorizedFetch(`/v1/workspaces/${workspaceId}/invites`);
  return (await response.json()) as PaginatedResult<WorkspaceInviteRecord>;
}

export async function createWorkspaceInvite(
  workspaceId: string,
  payload: CreateInvitePayload
): Promise<WorkspaceInviteRecord> {
  const response = await authorizedFetch(`/v1/workspaces/${workspaceId}/invites`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as InviteResponse;
  return data.invite;
}

export async function resendWorkspaceInvite(
  workspaceId: string,
  inviteId: string
): Promise<WorkspaceInviteRecord> {
  const response = await authorizedFetch(
    `/v1/workspaces/${workspaceId}/invites/${inviteId}/resend`,
    {
      method: "POST",
    }
  );

  const data = (await response.json()) as InviteResponse;
  return data.invite;
}

export async function revokeWorkspaceInvite(workspaceId: string, inviteId: string): Promise<void> {
  await authorizedFetch(`/v1/workspaces/${workspaceId}/invites/${inviteId}`, {
    method: "DELETE",
  });
}

export async function acceptWorkspaceInvite(token: string): Promise<AcceptWorkspaceInviteResult> {
  const response = await authorizedFetch(`/v1/workspaces/invites/${token}/accept`, {
    method: "POST",
  });

  return (await response.json()) as AcceptWorkspaceInviteResult;
}
