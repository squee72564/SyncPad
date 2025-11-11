"use server";

import { revalidatePath } from "next/cache";
import {
  WorkspaceInviteRecord,
  WorkspaceInviteRole,
  createWorkspaceInvite,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
} from "@/lib/invites";

const INVITES_PATH = "/dashboard/invites";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const formatError = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export async function createWorkspaceInviteAction(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceInviteRole;
}): Promise<ActionResult<WorkspaceInviteRecord>> {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  try {
    const invite = await createWorkspaceInvite(input.workspaceId, {
      email,
      role: input.role,
    });

    revalidatePath(INVITES_PATH);

    return {
      success: true,
      data: invite,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to send invite"),
    };
  }
}

export async function resendWorkspaceInviteAction(input: {
  workspaceId: string;
  inviteId: string;
}): Promise<ActionResult<WorkspaceInviteRecord>> {
  try {
    const invite = await resendWorkspaceInvite(input.workspaceId, input.inviteId);

    revalidatePath(INVITES_PATH);

    return {
      success: true,
      data: invite,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to resend invite"),
    };
  }
}

export async function revokeWorkspaceInviteAction(input: {
  workspaceId: string;
  inviteId: string;
}): Promise<ActionResult> {
  try {
    await revokeWorkspaceInvite(input.workspaceId, input.inviteId);

    revalidatePath(INVITES_PATH);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to revoke invite"),
    };
  }
}
