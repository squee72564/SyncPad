import {
  Hocuspocus,
  type onAuthenticatePayload,
  type onConfigurePayload,
  type onConnectPayload,
  type onDisconnectPayload,
  type onLoadDocumentPayload,
  type onStoreDocumentPayload,
} from "@hocuspocus/server";
import { applyUpdate, encodeStateAsUpdate } from "yjs";
import { fromNodeHeaders } from "better-auth/node";
import type { SessionWithImpersonatedBy, UserWithRole } from "better-auth/plugins";

import auth from "../lib/auth.ts";
import documentService from "../services/document.service.ts";
import workspaceService from "../services/workspace.service.ts";
import prisma from "../lib/prisma.ts";
import logger from "./logger.ts";
import {
  type WorkspacePermission,
  ALL_PERMISSIONS,
  WORKSPACE_ROLE_PERMISSIONS,
} from "../types/workspace.types.ts";
import type {
  Document as PrismaDocument,
  Workspace,
  WorkspaceMember,
} from "../../prisma/generated/prisma-postgres/index.js";

type DocumentWithWorkspace = PrismaDocument & { workspace: Workspace };

type CollaborationContext = {
  documentId: string;
  documentStatus: PrismaDocument["status"];
  workspaceId: string;
  permissions: WorkspacePermission[];
  canEdit: boolean;
  userId: string;
};

const setCollaborationContext = (context: Record<string, unknown>, value: CollaborationContext) => {
  context.collaboration = value;
};

const getCollaborationContext = (context: Record<string, unknown>): CollaborationContext => {
  const collab = context?.collaboration;

  if (!collab) {
    throw new Error("Missing collaboration context");
  }

  return collab as CollaborationContext;
};

const decodeSnapshot = (snapshot: unknown): Uint8Array | null => {
  if (typeof snapshot !== "string" || snapshot.length === 0) {
    return null;
  }

  try {
    return Buffer.from(snapshot, "base64");
  } catch (error) {
    logger.warn("Failed to decode collaboration snapshot", { error });
    return null;
  }
};

const encodeSnapshot = (document: onStoreDocumentPayload["document"]) => {
  return Buffer.from(encodeStateAsUpdate(document)).toString("base64");
};

const computePermissions = (
  membership: WorkspaceMember | null,
  isSuperAdmin: boolean
): WorkspacePermission[] => {
  const permissions = new Set<WorkspacePermission>();

  if (isSuperAdmin) {
    ALL_PERMISSIONS.forEach((permission) => permissions.add(permission));
  }

  if (membership) {
    WORKSPACE_ROLE_PERMISSIONS[membership.role].forEach((permission) =>
      permissions.add(permission)
    );
  }

  return Array.from(permissions);
};

const resolveDocument = async (documentId: string): Promise<DocumentWithWorkspace> => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { workspace: true },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
};

const authenticateCollaboration = async (data: onAuthenticatePayload) => {
  const documentId = data.requestParameters.get("document") ?? data.documentName;

  if (!documentId) {
    throw new Error("Missing document identifier");
  }

  const sessionResult = await auth.api.getSession({
    headers: fromNodeHeaders(data.requestHeaders),
  });

  if (!sessionResult) {
    throw new Error("Unauthorized");
  }

  const user = sessionResult.user as UserWithRole;
  const session = sessionResult.session as SessionWithImpersonatedBy;

  if (!user || !session) {
    throw new Error("Unauthorized");
  }

  const document = await resolveDocument(documentId);
  const membership = await workspaceService.getWorkspaceMemeber(document.workspaceId, user.id);

  const roles = (user.role || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const isSuperAdmin = roles.includes("superAdmin");

  if (!membership && !isSuperAdmin) {
    throw new Error("Forbidden: workspace membership required");
  }

  const permissions = computePermissions(membership, isSuperAdmin);

  if (!permissions.includes("document:read")) {
    throw new Error("Forbidden: missing document read permission");
  }

  const isDraft = document.status === "DRAFT";
  const canEdit = isDraft && permissions.includes("document:update");

  data.connectionConfig.readOnly = !canEdit;

  setCollaborationContext(data.context, {
    documentId: document.id,
    documentStatus: document.status,
    workspaceId: document.workspaceId,
    permissions,
    canEdit,
    userId: user.id,
  });

  logger.debug("HocusPocus authenticated connection", {
    documentId: document.id,
    workspaceId: document.workspaceId,
    userId: user.id,
    readOnly: !canEdit,
  });
};

const hocuspocusServer = new Hocuspocus({
  name: "hocus-pocus-instance",

  onConfigure: async (data: onConfigurePayload) => {
    logger.debug("HocusPocus onConfigure", {
      instance: data.instance.configuration.name,
      version: data.version,
    });
  },

  onConnect: async (data: onConnectPayload) => {
    logger.debug("HocusPocus onConnect", {
      documentName: data.documentName,
      socketId: data.socketId,
    });
  },

  onDisconnect: async (data: onDisconnectPayload) => {
    logger.debug("HocusPocus onDisconnect", {
      clientsCount: data.clientsCount,
      documentName: data.documentName,
      socketId: data.socketId,
    });
  },

  onAuthenticate: async (data: onAuthenticatePayload) => {
    await authenticateCollaboration(data);
  },

  onLoadDocument: async (data: onLoadDocumentPayload) => {
    const context = getCollaborationContext(data.context);
    const collabState = await documentService.getDocumentCollabState(
      context.workspaceId,
      context.documentId
    );

    const bytes = decodeSnapshot(collabState?.snapshot);

    if (bytes) {
      applyUpdate(data.document, bytes);
      logger.debug("HocusPocus loaded document snapshot", {
        documentId: context.documentId,
        version: collabState?.version,
      });
    } else {
      logger.debug("HocusPocus no snapshot found", { documentId: context.documentId });
    }
  },

  onStoreDocument: async (data: onStoreDocumentPayload) => {
    const context = getCollaborationContext(data.context);

    if (!context.canEdit) {
      logger.debug("Ignoring store request for read-only context", {
        documentId: context.documentId,
        userId: context.userId,
      });
      return;
    }

    const snapshot = encodeSnapshot(data.document);
    const collabState = await documentService.upsertDocumentCollabState(
      context.workspaceId,
      context.documentId,
      snapshot
    );

    logger.debug("HocusPocus stored collaboration snapshot", {
      documentId: context.documentId,
      workspaceId: context.workspaceId,
      version: collabState.version,
    });
  },
});

export const shutdownHocuspocus = async () => {
  try {
    // Close all connections
    hocuspocusServer.closeConnections();

    for (const document of hocuspocusServer.documents.values()) {
      hocuspocusServer.debouncer.executeNow?.(`onStoreDocument-${document.name}`);
      await hocuspocusServer.unloadDocument(document);
    }

    logger.info("HocusPocus server cleaned up");
  } catch (err) {
    logger.error("Error shutting down HocusPocus server", err);
  }
};

export default hocuspocusServer;
