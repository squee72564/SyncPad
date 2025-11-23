import request from "supertest";
import httpStatus from "http-status";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { type User } from "better-auth";
import type { UserWithRole } from "better-auth/plugins";

import type { WorkspaceContext } from "@/types/workspace.types.ts";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceInvite,
} from "@generated/prisma-postgres/index.js";

type WorkspaceServiceMock = {
  listUserWorkspaces: ReturnType<typeof vi.fn>;
  createWorkspace: ReturnType<typeof vi.fn>;
  getWorkspaceByIdentifier: ReturnType<typeof vi.fn>;
  getWorkspaceMemeber: ReturnType<typeof vi.fn>;
  updateWorkspace: ReturnType<typeof vi.fn>;
  deleteWorkspace: ReturnType<typeof vi.fn>;
  listWorkspaceInvites: ReturnType<typeof vi.fn>;
  createWorkspaceInvite: ReturnType<typeof vi.fn>;
  resendWorkspaceInvite: ReturnType<typeof vi.fn>;
  revokeWorkspaceInvite: ReturnType<typeof vi.fn>;
  acceptWorkspaceInvite: ReturnType<typeof vi.fn>;
};

type ActivityLogServiceMock = {
  createActivityLog: ReturnType<typeof vi.fn>;
  deleteActivityLog: ReturnType<typeof vi.fn>;
  listActivityLogs: ReturnType<typeof vi.fn>;
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
  banned: false,
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

const baseWorkspaceInvite: WorkspaceInvite = {
  id: "cmhuzyo4e000004l7hqwx8n06",
  workspaceId: baseWorkspace.id,
  email: "invitee@example.com",
  token: "testing-token",
  role: "VIEWER",
  invitedById: TEST_USER_ID,
  expiresAt: new Date("2024-01-02T00:00:00.000Z"),
  acceptedAt: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
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

const emailServiceMock = vi.hoisted(() => ({
  queueWorkspaceInviteEmail: vi.fn(),
  buildWorkspaceInviteAcceptUrl: vi.fn((token: string) => `http://localhost:3000/invites/${token}`),
}));

const workspaceServiceMock = vi.hoisted(() => ({
  listUserWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  getWorkspaceByIdentifier: vi.fn(),
  getWorkspaceMemeber: vi.fn(),
  updateWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  listWorkspaceInvites: vi.fn(),
  createWorkspaceInvite: vi.fn(),
  resendWorkspaceInvite: vi.fn(),
  revokeWorkspaceInvite: vi.fn(),
  acceptWorkspaceInvite: vi.fn(),
})) as WorkspaceServiceMock;

const activityLogServiceMock = vi.hoisted(() => ({
  createActivityLog: vi.fn().mockResolvedValue(undefined),
  deleteActivityLog: vi.fn().mockResolvedValue(undefined),
  listActivityLogs: vi.fn().mockResolvedValue({ activityLogs: [], nextCursor: null }),
})) as ActivityLogServiceMock;

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

vi.mock("../services/email.service.js", () => ({
  __esModule: true,
  default: emailServiceMock,
}));

vi.mock("../services/activity-log.service.js", () => ({
  __esModule: true,
  default: activityLogServiceMock,
}));

// Import after mocks so they receive the mocked dependencies.
import app from "@/app.js";

describe("Workspace routes", () => {
  beforeEach(() => {
    workspaceServiceMock.listUserWorkspaces.mockReset();
    workspaceServiceMock.createWorkspace.mockReset();
    workspaceServiceMock.getWorkspaceByIdentifier.mockReset();
    workspaceServiceMock.getWorkspaceMemeber.mockReset();
    workspaceServiceMock.updateWorkspace.mockReset();
    workspaceServiceMock.deleteWorkspace.mockReset();
    workspaceServiceMock.listWorkspaceInvites.mockReset();
    workspaceServiceMock.createWorkspaceInvite.mockReset();
    workspaceServiceMock.resendWorkspaceInvite.mockReset();
    workspaceServiceMock.revokeWorkspaceInvite.mockReset();
    workspaceServiceMock.acceptWorkspaceInvite.mockReset();
    emailServiceMock.queueWorkspaceInviteEmail.mockReset();
    emailServiceMock.buildWorkspaceInviteAcceptUrl.mockClear();
    activityLogServiceMock.createActivityLog.mockClear();
    activityLogServiceMock.deleteActivityLog.mockClear();
    activityLogServiceMock.listActivityLogs.mockClear();

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

  it("lists pending workspace invites", async () => {
    const inviteWithInviter = {
      ...baseWorkspaceInvite,
      invitedBy: {
        id: TEST_USER_ID,
        name: mockUser.name,
        email: mockUser.email,
      },
    };

    workspaceServiceMock.listWorkspaceInvites.mockResolvedValue([inviteWithInviter]);

    const response = await request(app).get(`/v1/workspaces/${baseWorkspace.id}/invites`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.invites).toHaveLength(1);
    expect(response.body.invites[0]).toEqual(
      expect.objectContaining({
        id: baseWorkspaceInvite.id,
        email: baseWorkspaceInvite.email,
        acceptUrl: expect.stringContaining(`/invites/${baseWorkspaceInvite.token}`),
      })
    );
    expect(response.body.invites[0].token).toBeUndefined();
    expect(emailServiceMock.buildWorkspaceInviteAcceptUrl).toHaveBeenCalledWith(
      baseWorkspaceInvite.token
    );
    expect(emailServiceMock.queueWorkspaceInviteEmail).not.toHaveBeenCalled();
    expect(workspaceServiceMock.listWorkspaceInvites).toHaveBeenCalledWith(baseWorkspace.id);
  });

  it("creates a workspace invite", async () => {
    const inviteWithInviter = {
      ...baseWorkspaceInvite,
      invitedBy: {
        id: TEST_USER_ID,
        name: mockUser.name,
        email: mockUser.email,
      },
    };

    workspaceServiceMock.createWorkspaceInvite.mockResolvedValue(inviteWithInviter);

    const response = await request(app)
      .post(`/v1/workspaces/${baseWorkspace.id}/invites`)
      .send({ email: baseWorkspaceInvite.email, role: baseWorkspaceInvite.role });

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.invite).toEqual(
      expect.objectContaining({
        id: baseWorkspaceInvite.id,
        email: baseWorkspaceInvite.email,
        role: baseWorkspaceInvite.role,
        acceptUrl: expect.stringContaining(`/invites/${baseWorkspaceInvite.token}`),
      })
    );
    expect(response.body.invite.token).toBeUndefined();
    expect(emailServiceMock.buildWorkspaceInviteAcceptUrl).toHaveBeenCalledWith(
      baseWorkspaceInvite.token
    );
    expect(workspaceServiceMock.createWorkspaceInvite).toHaveBeenCalledWith({
      workspaceId: baseWorkspace.id,
      email: baseWorkspaceInvite.email,
      role: baseWorkspaceInvite.role,
      invitedById: TEST_USER_ID,
    });
    expect(emailServiceMock.buildWorkspaceInviteAcceptUrl).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.queueWorkspaceInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        invite: inviteWithInviter,
        workspace: expect.objectContaining({ id: baseWorkspace.id }),
        acceptUrl: expect.stringContaining(`/invites/${baseWorkspaceInvite.token}`),
      })
    );
  });

  it("resends a workspace invite", async () => {
    const inviteWithInviter = {
      ...baseWorkspaceInvite,
      invitedBy: {
        id: TEST_USER_ID,
        name: mockUser.name,
        email: mockUser.email,
      },
    };

    workspaceServiceMock.resendWorkspaceInvite.mockResolvedValue(inviteWithInviter);

    const response = await request(app).post(
      `/v1/workspaces/${baseWorkspace.id}/invites/${baseWorkspaceInvite.id}/resend`
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.invite).toEqual(
      expect.objectContaining({
        id: baseWorkspaceInvite.id,
        acceptUrl: expect.stringContaining(`/invites/${baseWorkspaceInvite.token}`),
      })
    );
    expect(response.body.invite.token).toBeUndefined();
    expect(emailServiceMock.buildWorkspaceInviteAcceptUrl).toHaveBeenCalledWith(
      baseWorkspaceInvite.token
    );
    expect(workspaceServiceMock.resendWorkspaceInvite).toHaveBeenCalledWith(
      baseWorkspace.id,
      baseWorkspaceInvite.id,
      TEST_USER_ID
    );
    expect(emailServiceMock.queueWorkspaceInviteEmail).toHaveBeenCalledTimes(1);
  });

  it("revokes a workspace invite", async () => {
    workspaceServiceMock.revokeWorkspaceInvite.mockResolvedValue(undefined);

    const response = await request(app).delete(
      `/v1/workspaces/${baseWorkspace.id}/invites/${baseWorkspaceInvite.id}`
    );

    expect(response.status).toBe(httpStatus.NO_CONTENT);
    expect(workspaceServiceMock.revokeWorkspaceInvite).toHaveBeenCalledWith(
      baseWorkspace.id,
      baseWorkspaceInvite.id
    );
  });

  it("accepts a workspace invite", async () => {
    workspaceServiceMock.acceptWorkspaceInvite.mockResolvedValue({
      invite: {
        ...baseWorkspaceInvite,
        workspaceId: baseWorkspace.id,
        acceptedAt: new Date("2024-01-03T00:00:00.000Z"),
      },
      membership: baseMembership,
    });

    const response = await request(app).post(
      `/v1/workspaces/invites/${baseWorkspaceInvite.token}/accept`
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.workspaceId).toBe(baseWorkspace.id);
    expect(response.body.membership).toEqual(
      expect.objectContaining({
        id: baseMembership.id,
        role: baseMembership.role,
      })
    );
    expect(workspaceServiceMock.acceptWorkspaceInvite).toHaveBeenCalledWith(
      baseWorkspaceInvite.token,
      TEST_USER_ID
    );
  });
});
