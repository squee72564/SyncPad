"use server";

import { authorizedFetch } from "./api-client";
import type { PaginatedResult } from "./types";
import Prisma from "@generated/prisma-postgres/index";

export type AiListJobRecord = Prisma.AiJob & {
  document: Pick<Prisma.Document, "id" | "title" | "slug" | "status"> | null;
} & { requestedBy: Pick<Prisma.User, "id" | "name" | "email" | "image"> | null };

export type ListAiJobsParams = {
  cursor?: string | undefined;
  limit?: number | undefined;
  status?: Prisma.AiJobStatus | undefined;
  type?: Prisma.AiJobType | undefined;
  documentId?: string | undefined;
};

export const listAiJobs = async (
  workspaceId: string,
  params: ListAiJobsParams = {}
): Promise<PaginatedResult<AiListJobRecord>> => {
  const query = new URLSearchParams();

  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.type) query.set("type", params.type);
  if (params.status) query.set("status", params.status);
  if (params.documentId) query.set("documentId", params.documentId);

  const search = query.toString();

  const response = await authorizedFetch(
    `/v1/workspaces/${workspaceId}/ai-jobs${search ? `?${search}` : ""}`
  );

  return (await response.json()) as PaginatedResult<AiListJobRecord>;
};

export const listAiJob = async (workspaceId: string, aiJobId: string): Promise<AiListJobRecord> => {
  const response = await authorizedFetch(`/v1/workspaces/${workspaceId}/ai-jobs/${aiJobId}`);

  return (await response.json()) as AiListJobRecord;
};
