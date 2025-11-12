import request from "supertest";
import httpStatus from "http-status";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import type { User } from "better-auth";
import type { UserWithRole } from "better-auth/plugins";

import type { WorkspaceContext } from "../types/workspace.types.ts";
import type {
  DocumentShareLink,
  Workspace,
  WorkspaceMember,
} from "../../prisma/generated/prisma-postgres/index.js";

type ShareLinkServiceMock = {
  listShareLinks: ReturnType<typeof vi.fn>;
  createShareLink: ReturnType<typeof vi.fn>;
  updateShareLink: ReturnType<typeof vi.fn>;
  deleteShareLink: ReturnType<typeof vi.fn>;
  getShareLinkByToken: ReturnType<typeof vi.fn>;
};

const TEST_USER_ID = "user_share_link";
const WORKSPACE_ID = "cw_1234567890123456789012345";
const DOCUMENT_ID = "cd_1234567890123456789012345";

const mockUser: User & UserWithRole = {
  id: TEST_USER_ID,
  createdAt: new Date("2024-02-01T00:00:00.000Z"),
  updatedAt: new Date("2024-02-01T00:00:00.000Z"),
  email: "share.link@example.com",
  emailVerified: true,
  name: "Share Link Tester",
  role: "user",
};

const baseWorkspace: Workspace = {
  id: WORKSPACE_ID,
  name: "Share Link Workspace",
  slug: "share-link-workspace",
  description: null,
  createdAt: new Date("2024-02-01T00:00:00.000Z"),
  updatedAt: new Date("2024-02-01T00:00:00.000Z"),
  createdById: TEST_USER_ID,
};

const baseMembership: WorkspaceMember = {
  id: "wm_share_link",
  workspaceId: WORKSPACE_ID,
  userId: TEST_USER_ID,
  role: "OWNER",
  createdAt: new Date("2024-02-01T00:00:00.000Z"),
  updatedAt: new Date("2024-02-01T00:00:00.000Z"),
};

const baseShareLink: DocumentShareLink = {
  id: "cmhvk1b2s000004lk2clvehtq",
  documentId: DOCUMENT_ID,
  workspaceId: WORKSPACE_ID,
  createdById: TEST_USER_ID,
  token: "share-token-123",
  permission: "VIEW",
  expiresAt: new Date("2024-03-01T00:00:00.000Z"),
  createdAt: new Date("2024-02-02T00:00:00.000Z"),
};

const workspaceContext: WorkspaceContext = {
  workspace: baseWorkspace,
  membership: baseMembership,
  effectiveRole: "OWNER",
  permissions: ["share:manage", "document:read"],
};

const cloneContext = (): WorkspaceContext => ({
  workspace: { ...workspaceContext.workspace },
  membership: workspaceContext.membership
    ? { ...workspaceContext.membership }
    : undefined,
  effectiveRole: workspaceContext.effectiveRole,
  permissions: [...workspaceContext.permissions],
});

const shareLinkServiceMock = vi.hoisted(() => ({
  listShareLinks: vi.fn(),
  createShareLink: vi.fn(),
  updateShareLink: vi.fn(),
  deleteShareLink: vi.fn(),
  getShareLinkByToken: vi.fn(),
})) as ShareLinkServiceMock;

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

vi.mock("../services/share-link.service.js", () => ({
  __esModule: true,
  default: shareLinkServiceMock,
}));

vi.mock("../config/index.js", () => ({
  __esModule: true,
  default: {
    APP_BASE_URL: "http://localhost:3000",
  },
}));

import app from "../app.js";

describe("Share link routes", () => {
  beforeEach(() => {
    shareLinkServiceMock.listShareLinks.mockReset();
    shareLinkServiceMock.createShareLink.mockReset();
    shareLinkServiceMock.updateShareLink.mockReset();
    shareLinkServiceMock.deleteShareLink.mockReset();
    shareLinkServiceMock.getShareLinkByToken.mockReset();

    workspaceContext.workspace = { ...baseWorkspace };
    workspaceContext.membership = { ...baseMembership };
    workspaceContext.permissions = ["share:manage", "document:read"];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /v1/workspaces/:workspaceId/documents/:documentId/share-links", () => {
    it("lists share links for a document", async () => {
      shareLinkServiceMock.listShareLinks.mockResolvedValue([
        {
          ...baseShareLink,
          createdBy: {
            id: TEST_USER_ID,
            name: mockUser.name,
            email: mockUser.email,
          },
        },
      ]);

      const response = await request(app).get(
        `/v1/workspaces/${WORKSPACE_ID}/documents/${DOCUMENT_ID}/share-links`
      );

      expect(response.status).toBe(httpStatus.OK);
      expect(shareLinkServiceMock.listShareLinks).toHaveBeenCalledWith(WORKSPACE_ID, DOCUMENT_ID);
      expect(response.body.shareLinks).toHaveLength(1);
      expect(response.body.shareLinks[0]).toEqual(
        expect.objectContaining({
          id: baseShareLink.id,
          permission: baseShareLink.permission,
          url: expect.stringContaining(baseShareLink.token),
        })
      );
    });
  });

  describe("POST /v1/workspaces/:workspaceId/documents/:documentId/share-links", () => {
    it("creates a share link", async () => {
      const expiresAt = new Date("2024-03-15T00:00:00.000Z");
      shareLinkServiceMock.createShareLink.mockResolvedValue({
        ...baseShareLink,
        permission: "EDIT",
        expiresAt,
        createdBy: {
          id: TEST_USER_ID,
          name: mockUser.name,
          email: mockUser.email,
        },
      });

      const response = await request(app)
        .post(`/v1/workspaces/${WORKSPACE_ID}/documents/${DOCUMENT_ID}/share-links`)
        .send({ permission: "EDIT", expiresAt: expiresAt.toISOString() });

      expect(response.status).toBe(httpStatus.CREATED);
      expect(shareLinkServiceMock.createShareLink).toHaveBeenCalledWith(
        WORKSPACE_ID,
        DOCUMENT_ID,
        "EDIT",
        expiresAt,
        TEST_USER_ID
      );
      expect(response.body.shareLink.permission).toBe("EDIT");
      expect(response.body.shareLink.url).toContain(baseShareLink.token);
    });
  });

  describe("PATCH /v1/workspaces/:workspaceId/documents/:documentId/share-links/:shareLinkId", () => {
    it("updates a share link", async () => {
      shareLinkServiceMock.updateShareLink.mockResolvedValue({
        ...baseShareLink,
        permission: "COMMENT",
        createdBy: null,
      });

      const response = await request(app)
        .patch(
          `/v1/workspaces/${WORKSPACE_ID}/documents/${DOCUMENT_ID}/share-links/${baseShareLink.id}`
        )
        .send({ permission: "COMMENT", regenerateToken: true });

      expect(response.status).toBe(httpStatus.OK);
      expect(shareLinkServiceMock.updateShareLink).toHaveBeenCalledWith(
        WORKSPACE_ID,
        DOCUMENT_ID,
        baseShareLink.id,
        expect.objectContaining({
          permission: "COMMENT",
          regenerateToken: true,
        })
      );
      expect(response.body.shareLink.permission).toBe("COMMENT");
    });
  });

  describe("DELETE /v1/workspaces/:workspaceId/documents/:documentId/share-links/:shareLinkId", () => {
    it("revokes a share link", async () => {
      shareLinkServiceMock.deleteShareLink.mockResolvedValue(undefined);

      const response = await request(app).delete(
        `/v1/workspaces/${WORKSPACE_ID}/documents/${DOCUMENT_ID}/share-links/${baseShareLink.id}`
      );

      expect(response.status).toBe(httpStatus.NO_CONTENT);
      expect(shareLinkServiceMock.deleteShareLink).toHaveBeenCalledWith(
        WORKSPACE_ID,
        DOCUMENT_ID,
        baseShareLink.id
      );
    });
  });

  describe("GET /v1/share-links/:token", () => {
    it("returns metadata for a valid share link token", async () => {
      shareLinkServiceMock.getShareLinkByToken.mockResolvedValue({
        ...baseShareLink,
        document: {
          id: DOCUMENT_ID,
          title: "Shared document",
          workspaceId: WORKSPACE_ID,
        },
        workspace: {
          id: WORKSPACE_ID,
          name: baseWorkspace.name,
          slug: baseWorkspace.slug,
        },
      });

      const response = await request(app).get(`/v1/share-links/${baseShareLink.token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.document.title).toBe("Shared document");
      expect(response.body.url).toContain(baseShareLink.token);
      expect(shareLinkServiceMock.getShareLinkByToken).toHaveBeenCalledWith(baseShareLink.token);
    });

    it("returns 404 when the token is invalid or expired", async () => {
      shareLinkServiceMock.getShareLinkByToken.mockResolvedValue(null);

      const response = await request(app).get("/v1/share-links/invalid-token");

      expect(response.status).toBe(httpStatus.NOT_FOUND);
      expect(response.body.message).toBe("Share link not found");
    });
  });
});
