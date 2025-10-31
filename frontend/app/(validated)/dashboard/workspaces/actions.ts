"use server";

import { revalidatePath } from "next/cache";
import { createWorkspace, deleteWorkspace, updateWorkspace } from "@/lib/workspaces";

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

    revalidatePath("/dashboard");

    return {
      success: true,
      workspaceId: result.workspace.id,
      slug: result.workspace.slug,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create workspace";
    return {
      success: false,
      error: message,
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

    revalidatePath("/dashboard");

    return {
      success: true,
      workspaceId: result.workspace.id,
      slug: result.workspace.slug,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update workspace";
    return {
      success: false,
      error: message,
    };
  }
}

export async function deleteWorkspaceAction(workspaceId: string): Promise<CreateWorkspaceResult> {
  try {
    await deleteWorkspace(workspaceId);
    revalidatePath("/dashboard");

    return {
      success: true,
      workspaceId,
      slug: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete workspace";
    return {
      success: false,
      error: message,
    };
  }
}
