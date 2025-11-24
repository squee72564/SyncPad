"use server";

import { revalidatePath } from "next/cache";

import { removeWorkspaceMemberApi, updateWorkspaceMemberRoleApi } from "@/lib/workspaces";

import { formatError } from "@/lib/utils";
import { ActionResult } from "@/lib/types";

const MEMBERS_PATH = "/dashboard/members";

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
      error: formatError(error, "Failed to update member role"),
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
      error: formatError(error, "Failed to remove member"),
    };
  }
}
