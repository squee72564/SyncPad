"use server";

import { authorizedFetch } from "./api-client";

export type ShareLinkPermission = "VIEW" | "COMMENT" | "EDIT";

export type ShareLinkRecord = {
  id: string;
  permission: ShareLinkPermission;
  expiresAt: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  url: string;
};

export type ShareLinkPreview = {
  token: string;
  permission: ShareLinkPermission;
  expiresAt: string | null;
  document: {
    id: string;
    title: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  url: string;
};

type ShareLinksResponse = {
  shareLinks: ShareLinkRecord[];
};

type ShareLinkResponse = {
  shareLink: ShareLinkRecord;
};

export async function listShareLinks(workspaceId: string, documentId: string) {
  const response = await authorizedFetch(
    `/v1/workspaces/${workspaceId}/documents/${documentId}/share-links`
  );

  const data = (await response.json()) as ShareLinksResponse;
  return data.shareLinks;
}

export async function createShareLink(
  workspaceId: string,
  documentId: string,
  payload: { permission: ShareLinkPermission; expiresAt?: string | null }
) {
  const response = await authorizedFetch(
    `/v1/workspaces/${workspaceId}/documents/${documentId}/share-links`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = (await response.json()) as ShareLinkResponse;
  return data.shareLink;
}

export async function updateShareLink(
  workspaceId: string,
  documentId: string,
  shareLinkId: string,
  payload: {
    permission?: ShareLinkPermission;
    expiresAt?: string | null;
    regenerateToken?: boolean;
  }
) {
  const response = await authorizedFetch(
    `/v1/workspaces/${workspaceId}/documents/${documentId}/share-links/${shareLinkId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = (await response.json()) as ShareLinkResponse;
  return data.shareLink;
}

export async function deleteShareLink(
  workspaceId: string,
  documentId: string,
  shareLinkId: string
) {
  await authorizedFetch(
    `/v1/workspaces/${workspaceId}/documents/${documentId}/share-links/${shareLinkId}`,
    {
      method: "DELETE",
    }
  );
}

export async function previewShareLink(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
  const response = await fetch(`${baseUrl}/v1/share-links/${token}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to preview share link");
  }

  return (await response.json()) as ShareLinkPreview;
}
