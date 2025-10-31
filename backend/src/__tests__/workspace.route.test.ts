import request from "supertest";
import httpStatus from "http-status";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import type { User } from "better-auth";
import type { UserWithRole } from "better-auth/plugins";

import type { WorkspaceContext } from "../types/workspace.js";
import type { Workspace, WorkspaceMember } from "../../prisma/generated/prisma-postgres/index.js";

type WorkspaceServiceMock = {
  listUserWorkspaces: ReturnType<typeof vi.fn>;
  createWorkspace: ReturnType<typeof vi.fn>;
  getWorkspaceByIdentifier: ReturnType<typeof vi.fn>;
  getWorkspaceMemeber: ReturnType<typeof vi.fn>;
  updateWorkspace: ReturnType<typeof vi.fn>;
  deleteWorkspace: ReturnType<typeof vi.fn>;
};

const TEST_USER_ID = "user_123";
const OWNER_ROLE = "OWNER" as const;

const mockUser: User & UserWithRole = {
  id: TEST_USER_ID,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  email: "workspace.test@example.com",
  emailVerified: true,
  name: "Workspace Test User",
  role: "user",
};

const baseWorkspace: Workspace = {
  id: "ckzbqk5pq0000s8n1x9cbk8j7",
  name: "Test Workspace",
  slug: "test-workspace",
  description: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  createdById: TEST_USER_ID,
};

const baseMembership: WorkspaceMember = {
  id: "wm_123",
  workspaceId: baseWorkspace.id,
  userId: TEST_USER_ID,
  role: OWNER_ROLE,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const workspaceContext: WorkspaceContext = {
  workspace: baseWorkspace,
  membership: baseMembership,
  effectiveRole: OWNER_ROLE,
  permissions: ["workspace:view", "workspace:manage", "workspace:delete"],
};

const cloneContext = (): WorkspaceContext => ({
  workspace: { ...workspaceContext.workspace },
  membership: workspaceContext.membership
    ? {
        id: workspaceContext.membership.id,
        workspaceId: workspaceContext.membership.workspaceId,
        userId: workspaceContext.membership.userId,
        role: workspaceContext.membership.role,
        createdAt: workspaceContext.membership.createdAt,
        updatedAt: workspaceContext.membership.updatedAt,
      }
    : undefined,
  effectiveRole: workspaceContext.effectiveRole,
  permissions: [...workspaceContext.permissions],
});

const workspaceServiceMock = vi.hoisted(() => ({
  listUserWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  getWorkspaceByIdentifier: vi.fn(),
  getWorkspaceMemeber: vi.fn(),
  updateWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
})) as WorkspaceServiceMock;

vi.mock("../middleware/auth.js", () => ({
  __esModule: true,
  default: () => (req: Request, _res: Response, next: NextFunction) => {
    req.user = { ...mockUser };
    next();
  },
}));

vi.mock("../middleware/workspace.js", () => ({
  __esModule: true,
  attachWorkspaceContext: () => (req: Request, _res: Response, next: NextFunction) => {
    req.workspaceContext = cloneContext();
    next();
  },
  requireWorkspacePermission: () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
  requireWorkspaceRole: () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
}));

vi.mock("../services/workspace.service.js", () => ({
  __esModule: true,
  default: workspaceServiceMock,
}));

// Import after mocks so they receive the mocked dependencies.
import app from "../app.js";

describe("Workspace routes", () => {
  beforeEach(() => {
    workspaceServiceMock.listUserWorkspaces.mockReset();
    workspaceServiceMock.createWorkspace.mockReset();
    workspaceServiceMock.getWorkspaceByIdentifier.mockReset();
    workspaceServiceMock.getWorkspaceMemeber.mockReset();
    workspaceServiceMock.updateWorkspace.mockReset();
    workspaceServiceMock.deleteWorkspace.mockReset();

    workspaceContext.workspace = { ...baseWorkspace };
    workspaceContext.membership = { ...baseMembership };
    workspaceContext.effectiveRole = OWNER_ROLE;
    workspaceContext.permissions = ["workspace:view", "workspace:manage", "workspace:delete"];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists workspaces for the authenticated user", async () => {
    workspaceServiceMock.listUserWorkspaces.mockResolvedValue([
      {
        workspace: baseWorkspace,
        membership: baseMembership,
        effectiveRole: OWNER_ROLE,
      },
    ]);

    const response = await request(app).get("/v1/workspaces");

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      workspaces: [
        {
          workspace: expect.objectContaining({
            id: baseWorkspace.id,
            name: baseWorkspace.name,
            slug: baseWorkspace.slug,
          }),
          effectiveRole: OWNER_ROLE,
        },
      ],
    });

    expect(workspaceServiceMock.listUserWorkspaces).toHaveBeenCalledWith(TEST_USER_ID, {});
  });

  it("includes membership data when requested", async () => {
    workspaceServiceMock.listUserWorkspaces.mockResolvedValue([
      {
        workspace: baseWorkspace,
        membership: baseMembership,
        effectiveRole: OWNER_ROLE,
      },
    ]);

    const response = await request(app).get("/v1/workspaces").query({ includeMembership: "true" });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.workspaces[0]).toEqual({
      workspace: expect.objectContaining({
        id: baseWorkspace.id,
        name: baseWorkspace.name,
        slug: baseWorkspace.slug,
      }),
      membership: expect.objectContaining({
        id: baseMembership.id,
        role: baseMembership.role,
      }),
      effectiveRole: OWNER_ROLE,
    });
  });

  it("creates a workspace for the user", async () => {
    workspaceServiceMock.createWorkspace.mockResolvedValue({
      workspace: baseWorkspace,
      membership: baseMembership,
      effectiveRole: OWNER_ROLE,
    });

    const payload = {
      name: "New Workspace",
      slug: "new-workspace",
      description: "A new workspace",
    };

    const response = await request(app).post("/v1/workspaces").send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body).toEqual({
      workspace: expect.objectContaining({
        id: baseWorkspace.id,
        name: baseWorkspace.name,
        slug: baseWorkspace.slug,
      }),
      membership: expect.objectContaining({
        id: baseMembership.id,
        role: baseMembership.role,
      }),
      effectiveRole: OWNER_ROLE,
    });

    expect(workspaceServiceMock.createWorkspace).toHaveBeenCalledWith(payload, TEST_USER_ID);
  });

  it("returns workspace context for scoped requests", async () => {
    const response = await request(app).get(`/v1/workspaces/${baseWorkspace.id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      workspace: expect.objectContaining({
        id: baseWorkspace.id,
        name: baseWorkspace.name,
      }),
      membership: expect.objectContaining({
        id: baseMembership.id,
        role: baseMembership.role,
      }),
      effectiveRole: OWNER_ROLE,
      permissions: workspaceContext.permissions,
    });
  });

  it("updates a workspace", async () => {
    const updatedWorkspace = {
      ...baseWorkspace,
      name: "Updated Workspace",
    };

    workspaceServiceMock.updateWorkspace.mockResolvedValue(updatedWorkspace);

    const response = await request(app)
      .patch(`/v1/workspaces/${baseWorkspace.id}`)
      .send({ name: "Updated Workspace" });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.workspace).toEqual(
      expect.objectContaining({
        id: baseWorkspace.id,
        name: "Updated Workspace",
      })
    );
    expect(workspaceServiceMock.updateWorkspace).toHaveBeenCalledWith(baseWorkspace.id, {
      name: "Updated Workspace",
    });
  });

  it("rejects workspace updates without payload", async () => {
    const response = await request(app).patch(`/v1/workspaces/${baseWorkspace.id}`).send({});

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(workspaceServiceMock.updateWorkspace).not.toHaveBeenCalled();
  });

  it("deletes a workspace", async () => {
    workspaceServiceMock.deleteWorkspace.mockResolvedValue(undefined);

    const response = await request(app).delete(`/v1/workspaces/${baseWorkspace.id}`);

    expect(response.status).toBe(httpStatus.NO_CONTENT);
    expect(workspaceServiceMock.deleteWorkspace).toHaveBeenCalledWith(baseWorkspace.id);
  });
});
