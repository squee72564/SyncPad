"use server";

import { cookies } from "next/headers";
import { authorizedFetch } from "./api-client";
import type { PaginatedResult } from "./types";
const ACTIVE_WORKSPACE_ID_COOKIE = "active_workspace_id";
const ACTIVE_WORKSPACE_SLUG_COOKIE = "active_workspace_slug";

export type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

export type WorkspaceMembership = {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceSummary = {
  workspace: WorkspaceRecord;
  membership?: WorkspaceMembership | null;
  effectiveRole: string;
};

type WorkspaceListResponse = {
  workspaces: WorkspaceSummary[];
};

type CreateWorkspacePayload = {
  name: string;
  slug: string;
  description?: string | null;
};

type UpdateWorkspacePayload = {
  name?: string;
  slug?: string;
  description?: string | null;
};

export async function getWorkspaces(options: { includeMembership?: boolean } = {}) {
  const query = new URLSearchParams();

  if (options.includeMembership) {
    query.set("includeMembership", "true");
  }

  const response = await authorizedFetch(
    `/v1/workspaces${query.size > 0 ? `?${query.toString()}` : ""}`
  );

  return (await response.json()) as WorkspaceListResponse;
}

export async function createWorkspace(payload: CreateWorkspacePayload) {
  const response = await authorizedFetch("/v1/workspaces", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as {
    workspace: WorkspaceRecord;
    membership: WorkspaceMembership | null;
    effectiveRole: string;
  };
}

export async function deleteWorkspace(workspaceId: string) {
  await authorizedFetch(`/v1/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
}

export async function updateWorkspace(workspaceId: string, payload: UpdateWorkspacePayload) {
  const response = await authorizedFetch(`/v1/workspaces/${workspaceId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as { workspace: WorkspaceRecord };
}

type WorkspaceSelectionCookies =
  | {
      workspaceId?: string;
      workspaceSlug?: string;
    }
  | undefined;

export async function readActiveWorkspaceSelection(): Promise<WorkspaceSelectionCookies> {
  const cookieStore = await cookies();

  const workspaceId = cookieStore.get(ACTIVE_WORKSPACE_ID_COOKIE)?.value;
  const workspaceSlug = cookieStore.get(ACTIVE_WORKSPACE_SLUG_COOKIE)?.value;

  if (!workspaceId && !workspaceSlug) {
    return undefined;
  }

  return {
    workspaceId: workspaceId ?? undefined,
    workspaceSlug: workspaceSlug ?? undefined,
  };
}

export async function setActiveWorkspaceSelection(workspace: Pick<WorkspaceRecord, "id" | "slug">) {
  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_WORKSPACE_ID_COOKIE, workspace.id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });

  cookieStore.set(ACTIVE_WORKSPACE_SLUG_COOKIE, workspace.slug, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearActiveWorkspaceSelection() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_WORKSPACE_ID_COOKIE);
  cookieStore.delete(ACTIVE_WORKSPACE_SLUG_COOKIE);
}

export type ActiveWorkspaceSummary = WorkspaceSummary | null;

export async function resolveActiveWorkspace(options?: {
  workspaces?: WorkspaceSummary[];
}): Promise<{
  workspaces: WorkspaceSummary[];
  activeWorkspace: ActiveWorkspaceSummary;
}> {
  const initialSelection = await readActiveWorkspaceSelection();
  const source =
    options?.workspaces ?? (await getWorkspaces({ includeMembership: true })).workspaces;

  if (!initialSelection) {
    return {
      workspaces: source,
      activeWorkspace: null,
    };
  }

  const match = source.find((entry) => {
    if (initialSelection.workspaceId && entry.workspace.id === initialSelection.workspaceId) {
      return true;
    }

    if (initialSelection.workspaceSlug && entry.workspace.slug === initialSelection.workspaceSlug) {
      return true;
    }

    return false;
  });

  return {
    workspaces: source,
    activeWorkspace: match ?? null,
  };
}

export type getWorkspaceMembersResult = {
  user: {
    name: string;
    id: string;
    email: string;
  };
  id: string;
  createdAt: Date;
  role: "OWNER" | "ADMIN" | "EDITOR" | "COMMENTER" | "VIEWER";
};

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<PaginatedResult<getWorkspaceMembersResult>> {
  const response = await authorizedFetch(`/v1/workspaces/${workspaceId}/members`);

  return (await response.json()) as PaginatedResult<getWorkspaceMembersResult>;
}

export async function updateWorkspaceMemberRoleApi(
  workspaceId: string,
  memberId: string,
  role: "ADMIN" | "EDITOR" | "COMMENTER" | "VIEWER"
) {
  const response = await authorizedFetch(`/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ role }),
  });

  return (await response.json()) as { member: unknown };
}

export async function removeWorkspaceMemberApi(workspaceId: string, memberId: string) {
  await authorizedFetch(`/v1/workspaces/${workspaceId}/members/${memberId}`, {
    method: "DELETE",
  });
}
