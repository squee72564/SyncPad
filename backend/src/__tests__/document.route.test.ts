import request from "supertest";
import httpStatus from "http-status";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import type { User } from "better-auth";
import type { UserWithRole } from "better-auth/plugins";

import type { WorkspaceContext } from "@/types/workspace.types.ts";
import type { Document, Workspace, WorkspaceMember } from "@generated/prisma-postgres/index.js";

type DocumentServiceMock = {
  listDocuments: ReturnType<typeof vi.fn>;
  createDocument: ReturnType<typeof vi.fn>;
  getDocumentById: ReturnType<typeof vi.fn>;
  updateDocument: ReturnType<typeof vi.fn>;
  deleteDocument: ReturnType<typeof vi.fn>;
  getDocumentCollabState: ReturnType<typeof vi.fn>;
  upsertDocumentCollabState: ReturnType<typeof vi.fn>;
};

type ActivityLogServiceMock = {
  createActivityLog: ReturnType<typeof vi.fn>;
  deleteActivityLog: ReturnType<typeof vi.fn>;
  listActivityLogs: ReturnType<typeof vi.fn>;
};

const TEST_USER_ID = "user_document";
const WORKSPACE_ID = "ckzbqk5pq0000s8n1x9cbk8w1";
const WORKSPACE_SLUG = "workspace-doc";
const DOCUMENT_ID = "ckzbqk5pq0000s8n1x9cbk8j9";
const OWNER_ROLE = "OWNER" as const;

const mockUser: User & UserWithRole = {
  id: TEST_USER_ID,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  email: "document.test@example.com",
  emailVerified: true,
  name: "Document Test User",
  role: "user",
  banned: false,
};

const baseWorkspace: Workspace = {
  id: WORKSPACE_ID,
  name: "Workspace For Documents",
  slug: WORKSPACE_SLUG,
  description: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  createdById: TEST_USER_ID,
};

const baseMembership: WorkspaceMember = {
  id: "membership_cuid_1",
  workspaceId: WORKSPACE_ID,
  userId: TEST_USER_ID,
  role: OWNER_ROLE,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const baseDocument: Document = {
  id: DOCUMENT_ID,
  workspaceId: WORKSPACE_ID,
  authorId: TEST_USER_ID,
  parentId: null,
  title: "Initial Document",
  slug: "initial-document",
  headline: "Document headline",
  status: "DRAFT",
  searchText: null,
  summary: null,
  content: null,
  publishedAt: null,
  lastEditedAt: new Date("2024-01-02T00:00:00.000Z"),
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

const baseContext: WorkspaceContext = {
  workspace: baseWorkspace,
  membership: baseMembership,
  effectiveRole: OWNER_ROLE,
  permissions: [
    "workspace:view",
    "document:read",
    "document:create",
    "document:update",
    "document:delete",
    "document:publish",
  ],
};

const cloneContext = (): WorkspaceContext => ({
  workspace: { ...baseContext.workspace },
  membership: baseContext.membership
    ? {
        id: baseContext.membership.id,
        workspaceId: baseContext.membership.workspaceId,
        userId: baseContext.membership.userId,
        role: baseContext.membership.role,
        createdAt: baseContext.membership.createdAt,
        updatedAt: baseContext.membership.updatedAt,
      }
    : undefined,
  effectiveRole: baseContext.effectiveRole,
  permissions: [...baseContext.permissions],
});

const documentServiceMock = vi.hoisted(() => ({
  listDocuments: vi.fn(),
  createDocument: vi.fn(),
  getDocumentById: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getDocumentCollabState: vi.fn(),
  upsertDocumentCollabState: vi.fn(),
})) as DocumentServiceMock;

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
  requireWorkspacePermission:
    () =>
    (_req: Request, _res: Response, next: NextFunction): void => {
      next();
    },
  requireWorkspaceRole: () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
}));

vi.mock("../services/document.service.js", () => ({
  __esModule: true,
  default: documentServiceMock,
}));

vi.mock("../services/activity-log.service.js", () => ({
  __esModule: true,
  default: activityLogServiceMock,
}));

import app from "@/app.js";

describe("Document routes", () => {
  beforeEach(() => {
    documentServiceMock.listDocuments.mockReset();
    documentServiceMock.createDocument.mockReset();
    documentServiceMock.getDocumentById.mockReset();
    documentServiceMock.updateDocument.mockReset();
    documentServiceMock.deleteDocument.mockReset();
    documentServiceMock.getDocumentCollabState.mockReset();
    documentServiceMock.upsertDocumentCollabState.mockReset();
    activityLogServiceMock.createActivityLog.mockClear();
    activityLogServiceMock.deleteActivityLog.mockClear();
    activityLogServiceMock.listActivityLogs.mockClear();

    baseContext.workspace = { ...baseWorkspace };
    baseContext.membership = { ...baseMembership };
    baseContext.effectiveRole = OWNER_ROLE;
    baseContext.permissions = [
      "workspace:view",
      "document:read",
      "document:create",
      "document:update",
      "document:delete",
      "document:publish",
    ];
  });

  describe("GET /v1/workspaces/:workspaceId/documents", () => {
    it("lists documents for the workspace", async () => {
      documentServiceMock.listDocuments.mockResolvedValue({
        documents: [baseDocument],
        nextCursor: null,
      });

      const response = await request(app).get(`/v1/workspaces/${WORKSPACE_SLUG}/documents`);

      expect(response.status).toBe(httpStatus.OK);
      expect(documentServiceMock.listDocuments).toHaveBeenCalledWith(WORKSPACE_ID, {});
      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              id: baseDocument.id,
              workspaceId: WORKSPACE_ID,
            }),
          ]),
          nextCursor: null,
        })
      );
    });

    it("passes query filters through to the service", async () => {
      documentServiceMock.listDocuments.mockResolvedValue([]);

      const parentId = "ckzbqk5pq0000s8n1x9cbk8p1";

      const response = await request(app)
        .get(`/v1/workspaces/${WORKSPACE_SLUG}/documents`)
        .query({ parentId, status: "PUBLISHED", includeContent: "true" });

      expect(response.status).toBe(httpStatus.OK);
      expect(documentServiceMock.listDocuments).toHaveBeenCalledWith(WORKSPACE_ID, {
        parentId,
        status: "PUBLISHED",
        includeContent: "true",
      });
    });
  });

  describe("POST /v1/workspaces/:workspaceId/documents", () => {
    it("creates a document", async () => {
      const payload = {
        title: "New Document",
        slug: "new-document",
        content: { ops: [] },
      };

      documentServiceMock.createDocument.mockResolvedValue({
        ...baseDocument,
        title: payload.title,
        slug: payload.slug,
        content: payload.content as Document["content"],
      });

      const response = await request(app)
        .post(`/v1/workspaces/${WORKSPACE_SLUG}/documents`)
        .send(payload);

      expect(response.status).toBe(httpStatus.CREATED);
      expect(documentServiceMock.createDocument).toHaveBeenCalledWith(
        WORKSPACE_ID,
        TEST_USER_ID,
        payload
      );
      expect(response.body.document).toEqual(
        expect.objectContaining({
          title: "New Document",
          slug: "new-document",
        })
      );
    });

    it("rejects invalid document payloads", async () => {
      const response = await request(app)
        .post(`/v1/workspaces/${WORKSPACE_SLUG}/documents`)
        .send({ slug: "missing-title" });

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
      expect(documentServiceMock.createDocument).not.toHaveBeenCalled();
    });
  });

  describe("GET /v1/workspaces/:workspaceId/documents/:documentId", () => {
    it("returns the requested document", async () => {
      documentServiceMock.getDocumentById.mockResolvedValue(baseDocument);

      const response = await request(app).get(
        `/v1/workspaces/${WORKSPACE_SLUG}/documents/${DOCUMENT_ID}`
      );

      expect(response.status).toBe(httpStatus.OK);
      expect(documentServiceMock.getDocumentById).toHaveBeenCalledWith(WORKSPACE_ID, DOCUMENT_ID);
      expect(response.body.document).toEqual(expect.objectContaining({ id: baseDocument.id }));
    });

    it("returns 404 when document is not found", async () => {
      documentServiceMock.getDocumentById.mockResolvedValue(null);

      const response = await request(app).get(
        `/v1/workspaces/${WORKSPACE_SLUG}/documents/${DOCUMENT_ID}`
      );

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("PATCH /v1/workspaces/:workspaceId/documents/:documentId", () => {
    it("updates a document", async () => {
      documentServiceMock.updateDocument.mockResolvedValue({
        ...baseDocument,
        title: "Updated Title",
      });

      const response = await request(app)
        .patch(`/v1/workspaces/${WORKSPACE_SLUG}/documents/${DOCUMENT_ID}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(httpStatus.OK);
      expect(documentServiceMock.updateDocument).toHaveBeenCalledWith(
        WORKSPACE_ID,
        DOCUMENT_ID,
        {
          title: "Updated Title",
        },
        TEST_USER_ID
      );
      expect(response.body.document.title).toBe("Updated Title");
    });

    it("rejects updates without fields", async () => {
      const response = await request(app)
        .patch(`/v1/workspaces/${WORKSPACE_SLUG}/documents/${DOCUMENT_ID}`)
        .send({});

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
      expect(documentServiceMock.updateDocument).not.toHaveBeenCalled();
    });

    it("blocks publishing without permission", async () => {
      baseContext.permissions = ["document:update"];

      const response = await request(app)
        .patch(`/v1/workspaces/${WORKSPACE_SLUG}/documents/${DOCUMENT_ID}`)
        .send({ status: "PUBLISHED" });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
      expect(documentServiceMock.updateDocument).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /v1/workspaces/:workspaceId/documents/:documentId", () => {
    it("deletes a document", async () => {
      documentServiceMock.deleteDocument.mockResolvedValue(undefined);

      const response = await request(app).delete(
        `/v1/workspaces/${WORKSPACE_SLUG}/documents/${DOCUMENT_ID}`
      );

      expect(response.status).toBe(httpStatus.NO_CONTENT);
      expect(documentServiceMock.deleteDocument).toHaveBeenCalledWith(WORKSPACE_ID, DOCUMENT_ID);
    });
  });
});
