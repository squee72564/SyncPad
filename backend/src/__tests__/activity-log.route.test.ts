import request from "supertest";
import httpStatus from "http-status";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

import type { WorkspaceContext } from "../types/workspace.types.ts";
import type { ActivityLog } from "../../prisma/generated/prisma-postgres/index.js";

const TEST_USER_ID = "cmhwwuyen000004l14krg6kzj";
const TEST_WORKSPACE_ID = "cmhwwv4ah000104l1e7p58wow";
const ACTIVITY_LOG_ID = "cmhwww4l4000204l1f9z12hlz";

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
  permissions: ["workspace:view", "workspace:manage"],
};

const activityLogServiceMock = vi.hoisted(() => ({
  createActivityLog: vi.fn(),
  deleteActivityLog: vi.fn(),
}));

vi.mock("../middleware/auth.js", () => ({
  __esModule: true,
  default: () => (req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      id: TEST_USER_ID,
      email: "activity-log@example.com",
      emailVerified: true,
      name: "Activity Log User",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      role: "user",
    };
    next();
  },
}));

vi.mock("../middleware/workspace.js", () => ({
  __esModule: true,
  attachWorkspaceContext: () => (req: Request, _res: Response, next: NextFunction) => {
    req.workspaceContext = {
      workspace: { ...workspaceContext.workspace },
      membership: workspaceContext.membership ? { ...workspaceContext.membership } : undefined,
      effectiveRole: workspaceContext.effectiveRole,
      permissions: [...workspaceContext.permissions],
    };
    next();
  },
  requireWorkspacePermission: () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
  requireWorkspaceRole: () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
}));

vi.mock("../services/activity-log.service.js", () => ({
  __esModule: true,
  default: activityLogServiceMock,
}));

import app from "../app.js";

describe("Activity log routes", () => {
  beforeEach(() => {
    activityLogServiceMock.createActivityLog.mockReset();
    activityLogServiceMock.deleteActivityLog.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates an activity log entry", async () => {
    const activityLog: ActivityLog = {
      id: ACTIVITY_LOG_ID,
      workspaceId: TEST_WORKSPACE_ID,
      actorId: TEST_USER_ID,
      documentId: null,
      event: "document.created",
      metadata: { documentId: "doc_123" },
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    activityLogServiceMock.createActivityLog.mockResolvedValue(activityLog);

    const response = await request(app)
      .post(`/v1/workspaces/${TEST_WORKSPACE_ID}/activity-logs`)
      .send({
        event: "document.created",
        metadata: { documentId: "doc_123" },
      });

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.activityLog).toMatchObject({
      id: activityLog.id,
      event: activityLog.event,
      workspaceId: TEST_WORKSPACE_ID,
    });
    expect(activityLogServiceMock.createActivityLog).toHaveBeenCalledWith(TEST_WORKSPACE_ID, {
      event: "document.created",
      metadata: { documentId: "doc_123" },
      documentId: undefined,
      actorId: TEST_USER_ID,
    });
  });

  it("deletes an activity log entry", async () => {
    activityLogServiceMock.deleteActivityLog.mockResolvedValue(undefined);

    const response = await request(app).delete(
      `/v1/workspaces/${TEST_WORKSPACE_ID}/activity-logs/${ACTIVITY_LOG_ID}`
    );

    expect(response.status).toBe(httpStatus.NO_CONTENT);
    expect(activityLogServiceMock.deleteActivityLog).toHaveBeenCalledWith(
      TEST_WORKSPACE_ID,
      ACTIVITY_LOG_ID
    );
  });
});
