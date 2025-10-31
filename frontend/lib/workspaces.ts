"use server";

import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

type WorkspaceMembership = {
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

async function buildCookieHeader(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookiePairs = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  return cookiePairs.length > 0 ? cookiePairs : undefined;
}

async function authorizedFetch(path: string, init: RequestInit = {}) {
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers(init.headers);

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = response.statusText || "Request failed";

    try {
      const data = await response.json();
      message = (data?.message as string) ?? (data?.error as string) ?? message;
    } catch {
      const fallback = await response.text();
      if (fallback) {
        message = fallback;
      }
    }

    throw new Error(message);
  }

  return response;
}

export async function getWorkspaces(options: { includeMembership?: boolean } = {}) {
  const query = new URLSearchParams();

  if (options.includeMembership) {
    query.set("includeMembership", "true");
  }

  const response = await authorizedFetch(
    `/v1/workspaces${query.size > 0 ? `?${query.toString()}` : ""}`
  );

  const data = (await response.json()) as WorkspaceListResponse;
  return data;
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
