"use server";

import { authorizedFetch } from "./api-client";
import type { PaginatedResult } from "./types";
import Prisma from "@generated/prisma-postgres";

export type WorkspaceInviteRecord = Omit<Prisma.WorkspaceInvite, "token"> & {
  invitedBy?: Pick<Prisma.User, "id" | "name" | "email"> | null;
} & {
  acceptUrl?: string;
};

type CreateInvitePayload = {
  email: string;
  role: Prisma.WorkspaceRole;
};

type InviteResponse = {
  invite: WorkspaceInviteRecord;
};

export type AcceptWorkspaceInviteResult = Pick<
  Prisma.WorkspaceInvite,
  "workspaceId" | "acceptedAt"
> & { membership: Prisma.WorkspaceMember };

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
