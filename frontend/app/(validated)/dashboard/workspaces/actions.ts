"use server";

import {
  clearActiveWorkspaceSelection,
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  readActiveWorkspaceSelection,
  setActiveWorkspaceSelection,
  updateWorkspace,
  getWorkspaceMembers,
  getWorkspaceMembersResult,
} from "@/lib/workspaces";

import { formatError } from "@/lib/utils";
import { revalidatePaths } from "@/lib/api-client";

export type CreateWorkspaceInput = {
  name: string;
  slug: string;
  description?: string | null;
};

export type CreateWorkspaceResult =
  | {
      success: true;
      workspaceId: string;
      slug: string;
    }
  | {
      success: false;
      error: string;
    };

export async function createWorkspaceAction(
  input: CreateWorkspaceInput
): Promise<CreateWorkspaceResult> {
  const name = input.name?.trim();
  const slug = input.slug?.trim().toLowerCase();

  if (!name) {
    return { success: false, error: "Workspace name is required" };
  }

  if (!slug) {
    return { success: false, error: "Workspace slug is required" };
  }

  try {
    const result = await createWorkspace({
      name,
      slug,
      description: input.description ?? null,
    });

    await await revalidatePaths(["/dashboard"]);

    return {
      success: true,
      workspaceId: result.workspace.id,
      slug: result.workspace.slug,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to create workspace"),
    };
  }
}

export type UpdateWorkspaceInput = {
  workspaceId: string;
  name?: string;
  slug?: string;
  description?: string | null;
};

export async function updateWorkspaceAction(
  input: UpdateWorkspaceInput
): Promise<CreateWorkspaceResult> {
  const { workspaceId } = input;

  const updates: { name?: string; slug?: string; description?: string | null } = {};

  if (input.name?.trim()) {
    updates.name = input.name.trim();
  }

  if (input.slug?.trim()) {
    updates.slug = input.slug.trim().toLowerCase();
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() ? input.description.trim() : null;
  }

  if (!updates.name && !updates.slug && updates.description === undefined) {
    return { success: false, error: "Provide at least one field to update." };
  }

  try {
    const result = await updateWorkspace(workspaceId, updates);

    await revalidatePaths(["/dashboard"]);

    return {
      success: true,
      workspaceId: result.workspace.id,
      slug: result.workspace.slug,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to update workspace"),
    };
  }
}

export async function deleteWorkspaceAction(workspaceId: string): Promise<CreateWorkspaceResult> {
  try {
    await deleteWorkspace(workspaceId);

    const selection = await readActiveWorkspaceSelection();
    if (selection?.workspaceId === workspaceId || selection?.workspaceSlug === workspaceId) {
      await clearActiveWorkspaceSelection();
    }

    await revalidatePaths([
      "/dashboard",
      "/dashboard/documents",
      "/dashboard/documents/new",
      "/dashboard/documents/drafts",
      "/dashboard/documents/review",
      "/dashboard/documents/archived",
      "/dashboard/documents/published",
    ]);

    return {
      success: true,
      workspaceId,
      slug: "",
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Failed to delete workspace"),
    };
  }
}

export type SetActiveWorkspaceResult =
  | { success: true; workspaceId: string; slug: string }
  | { success: false; error: string };

export async function setActiveWorkspaceAction(
  workspaceId: string
): Promise<SetActiveWorkspaceResult> {
  const { workspaces } = await getWorkspaces({ includeMembership: true });

  const match = workspaces.find((entry) => entry.workspace.id === workspaceId);

  if (!match) {
    return { success: false, error: "Workspace not found" };
  }

  await setActiveWorkspaceSelection(match.workspace);

  await revalidatePaths([
    "/dashboard",
    "/dashboard/documents",
    "/dashboard/documents/new",
    "/dashboard/documents/drafts",
    "/dashboard/documents/review",
    "/dashboard/documents/archived",
    "/dashboard/documents/published",
  ]);

  return {
    success: true,
    workspaceId: match.workspace.id,
    slug: match.workspace.slug,
  };
}

export async function getWorkspaceMembersAction(
  workspaceId: string
): Promise<{ data: getWorkspaceMembersResult[]; nextCursor: string | null }> {
  const data = await getWorkspaceMembers(workspaceId);
  return data;
}
