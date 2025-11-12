"use server";

import { revalidatePath } from "next/cache";

import { removeWorkspaceMemberApi, updateWorkspaceMemberRoleApi } from "@/lib/workspaces";

const MEMBERS_PATH = "/dashboard/members";

type ActionResult<T = undefined> = { success: true; data?: T } | { success: false; error: string };

export async function updateWorkspaceMemberRoleAction(input: {
  workspaceId: string;
  memberId: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "COMMENTER" | "VIEWER";
}): Promise<ActionResult> {
  if (input.role === "OWNER") {
    return {
      success: false,
      error: "Cannot assign OWNER role to a member",
    };
  }

  try {
    await updateWorkspaceMemberRoleApi(input.workspaceId, input.memberId, input.role);
    revalidatePath(MEMBERS_PATH);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update member role",
    };
  }
}

export async function removeWorkspaceMemberAction(input: {
  workspaceId: string;
  memberId: string;
}): Promise<ActionResult> {
  try {
    await removeWorkspaceMemberApi(input.workspaceId, input.memberId);
    revalidatePath(MEMBERS_PATH);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}
