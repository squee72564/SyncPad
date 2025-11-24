"use server";

import { revalidatePath } from "next/cache";

import { createShareLink, deleteShareLink, updateShareLink } from "@/lib/share-links";

const SHARE_LINKS_PATH = "/dashboard/documents/share-links";

import { formatError } from "@/lib/utils";
import { ActionResult } from "@/lib/types";

export async function createShareLinkAction(input: {
  workspaceId: string;
  documentId: string;
  permission: "VIEW" | "COMMENT" | "EDIT";
  expiresAt?: string | null;
}): Promise<ActionResult> {
  try {
    await createShareLink(input.workspaceId, input.documentId, {
      permission: input.permission,
      expiresAt: input.expiresAt ?? null,
    });
    revalidatePath(SHARE_LINKS_PATH);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to create share link"),
    };
  }
}

export async function updateShareLinkAction(input: {
  workspaceId: string;
  documentId: string;
  shareLinkId: string;
  permission?: "VIEW" | "COMMENT" | "EDIT";
  expiresAt?: string | null;
  regenerateToken?: boolean;
}): Promise<ActionResult> {
  try {
    await updateShareLink(input.workspaceId, input.documentId, input.shareLinkId, {
      permission: input.permission,
      expiresAt: input.expiresAt,
      regenerateToken: input.regenerateToken,
    });
    revalidatePath(SHARE_LINKS_PATH);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to update share link"),
    };
  }
}

export async function deleteShareLinkAction(input: {
  workspaceId: string;
  documentId: string;
  shareLinkId: string;
}): Promise<ActionResult> {
  try {
    await deleteShareLink(input.workspaceId, input.documentId, input.shareLinkId);
    revalidatePath(SHARE_LINKS_PATH);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to delete share link"),
    };
  }
}
