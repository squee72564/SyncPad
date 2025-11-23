import request from "supertest";
import httpStatus from "http-status";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

import type { WorkspaceContext } from "@/types/workspace.types.ts";
import type { AiJob } from "@generated/prisma-postgres/index.js";

const TEST_USER_ID = "cmhwwuyen000004l14krg6kzj";
const TEST_WORKSPACE_ID = "cmhwwv4ah000104l1e7p58wow";
const TEST_DOCUMENT_ID = "cmhwww4l4000204l1f9z12hlz";
const TEST_JOB_ID = "cmhwxa1ye000304l1glfvcya0";

const workspaceContext: WorkspaceContext = {
  workspace: {
    id: TEST_WORKSPACE_ID,
    name: "Test Workspace",
    slug: "test-workspace",
    description: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    createdById: TEST_USER_ID,
  },
  membership: {
    id: "membership_123",
    workspaceId: TEST_WORKSPACE_ID,
    userId: TEST_USER_ID,
    role: "OWNER",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  },
  effectiveRole: "OWNER",
  permissions: ["ai:view"],
};

const cloneWorkspaceContext = (): WorkspaceContext => ({
  workspace: { ...workspaceContext.workspace },
  membership: workspaceContext.membership ? { ...workspaceContext.membership } : undefined,
  effectiveRole: workspaceContext.effectiveRole,
  permissions: [...workspaceContext.permissions],
});

const aiJobServiceMock = vi.hoisted(() => ({
  listAiJobs: vi.fn(),
  listAiJob: vi.fn(),
}));

vi.mock("../middleware/auth.js", () => ({
  __esModule: true,
  default: () => (req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      id: TEST_USER_ID,
      email: "ai.jobs@example.com",
      emailVerified: true,
      name: "AI Jobs User",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      role: "user",
      banned: false,
    };
    next();
  },
}));

vi.mock("../middleware/workspace.js", () => ({
  __esModule: true,
  attachWorkspaceContext: () => (req: Request, _res: Response, next: NextFunction) => {
    req.workspaceContext = cloneWorkspaceContext();
    next();
  },
  requireWorkspacePermission: () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
  requireWorkspaceRole: () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
}));

vi.mock("../services/index.ts", () => ({
  __esModule: true,
  aiJobService: aiJobServiceMock,
}));

import app from "@/app.js";

describe("AI job routes", () => {
  beforeEach(() => {
    aiJobServiceMock.listAiJobs.mockReset();
    aiJobServiceMock.listAiJob.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists AI jobs with filters and pagination", async () => {
    const aiJob: AiJob = {
      id: TEST_JOB_ID,
      workspaceId: TEST_WORKSPACE_ID,
      documentId: TEST_DOCUMENT_ID,
      revisionId: null,
      requestedById: TEST_USER_ID,
      type: "EMBEDDING",
      status: "PENDING",
      payload: { test: true },
      queuedAt: new Date("2024-01-02T00:00:00.000Z"),
      startedAt: null,
      completedAt: null,
      error: null,
    };

    aiJobServiceMock.listAiJobs.mockResolvedValue({
      aiJobs: [
        {
          ...aiJob,
          document: {
            id: TEST_DOCUMENT_ID,
            title: "Doc Title",
            slug: "doc-title",
            status: "PUBLISHED",
          },
          requestedBy: {
            id: TEST_USER_ID,
            name: "AI Jobs User",
            email: "ai.jobs@example.com",
            image: null,
          },
        },
      ],
      nextCursor: null,
    });

    const response = await request(app).get(`/v1/workspaces/${TEST_WORKSPACE_ID}/ai-jobs`).query({
      limit: "10",
      status: "PENDING",
      type: "EMBEDDING",
      documentId: TEST_DOCUMENT_ID,
    });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.aiJobs).toHaveLength(1);
    expect(response.body.aiJobs[0]).toMatchObject({
      id: TEST_JOB_ID,
      type: "EMBEDDING",
      status: "PENDING",
      document: {
        id: TEST_DOCUMENT_ID,
        slug: "doc-title",
      },
      requestedBy: {
        id: TEST_USER_ID,
        email: "ai.jobs@example.com",
      },
    });
    expect(response.body.nextCursor).toBeNull();
    expect(aiJobServiceMock.listAiJobs).toHaveBeenCalledWith(TEST_WORKSPACE_ID, {
      limit: "10",
      status: "PENDING",
      type: "EMBEDDING",
      documentId: TEST_DOCUMENT_ID,
    });
  });

  it("returns a single AI job", async () => {
    const aiJob: AiJob = {
      id: TEST_JOB_ID,
      workspaceId: TEST_WORKSPACE_ID,
      documentId: TEST_DOCUMENT_ID,
      revisionId: null,
      requestedById: TEST_USER_ID,
      type: "SUMMARY",
      status: "COMPLETED",
      payload: { summary: true },
      queuedAt: new Date("2024-01-03T00:00:00.000Z"),
      startedAt: new Date("2024-01-03T00:01:00.000Z"),
      completedAt: new Date("2024-01-03T00:02:00.000Z"),
      error: null,
    };

    aiJobServiceMock.listAiJob.mockResolvedValue({
      ...aiJob,
      document: null,
      requestedBy: {
        id: TEST_USER_ID,
        name: "AI Jobs User",
        email: "ai.jobs@example.com",
        image: null,
      },
    });

    const response = await request(app).get(
      `/v1/workspaces/${TEST_WORKSPACE_ID}/ai-jobs/${TEST_JOB_ID}`
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toMatchObject({
      id: TEST_JOB_ID,
      type: "SUMMARY",
      status: "COMPLETED",
      requestedBy: {
        id: TEST_USER_ID,
      },
    });
    expect(aiJobServiceMock.listAiJob).toHaveBeenCalledWith(TEST_JOB_ID, TEST_WORKSPACE_ID);
  });
});
