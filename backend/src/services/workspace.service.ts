import prisma from "../lib/prisma.js";
import type {
  CreateWorkspaceArgs,
  ListWorkspacesArgs,
  UpdateWorkspaceBody,
  WorkspaceLookupField,
} from "@/types/workspace.ts";
import type {
  Prisma,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "../../prisma/generated/prisma-postgres/index.js";

export interface WorkspaceListItem {
  workspace: Workspace;
  membership: WorkspaceMember | null;
  effectiveRole: WorkspaceRole;
}

const normalizeSlug = (slug: string) => slug.trim().toLowerCase();

const getWorkspaceByIdentifier = async (
  workspaceLookup: WorkspaceLookupField,
  identifier: string
) => {
  if (workspaceLookup === "auto") {
    const workspaceById = await prisma.workspace.findUnique({
      where: { id: identifier },
    });

    if (workspaceById) {
      return workspaceById;
    }

    return prisma.workspace.findUnique({
      where: { slug: normalizeSlug(identifier) },
    });
  }

  return prisma.workspace.findUnique({
    where: workspaceLookup === "slug" ? { slug: normalizeSlug(identifier) } : { id: identifier },
  });
};

const getWorkspaceMemeber = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });
};

const listUserWorkspaces = async (
  userId: string,
  _args?: ListWorkspacesArgs
): Promise<WorkspaceListItem[]> => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      workspace: {
        createdAt: "asc",
      },
    },
  });

  const resultMap = new Map<string, WorkspaceListItem>();

  memberships.forEach((membership) => {
    resultMap.set(membership.workspaceId, {
      workspace: membership.workspace,
      membership,
      effectiveRole: membership.role,
    });
  });

  const ownedWorkspaces = await prisma.workspace.findMany({
    where: {
      createdById: userId,
      id: {
        notIn: Array.from(resultMap.keys()),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  ownedWorkspaces.forEach((workspace) => {
    resultMap.set(workspace.id, {
      workspace,
      membership: null,
      effectiveRole: "OWNER",
    });
  });

  return Array.from(resultMap.values());
};

const createWorkspace = async (
  args: CreateWorkspaceArgs,
  userId: string
): Promise<WorkspaceListItem> => {
  const slug = normalizeSlug(args.slug);

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: args.name,
        slug,
        description: args.description ?? null,
        createdById: userId,
      },
    });

    const membership = await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: "OWNER",
      },
    });

    return {
      workspace,
      membership,
      effectiveRole: membership.role,
    };
  });
};

const updateWorkspace = async (workspaceId: string, updates: UpdateWorkspaceBody) => {
  const data: Prisma.WorkspaceUpdateInput = {};

  if (updates.name !== undefined) {
    data.name = updates.name;
  }

  if (updates.slug !== undefined) {
    data.slug = normalizeSlug(updates.slug);
  }

  if (updates.description !== undefined) {
    data.description = updates.description ?? null;
  }

  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });
};

const deleteWorkspace = async (workspaceId: string) => {
  await prisma.workspace.delete({
    where: { id: workspaceId },
  });
};

export default {
  getWorkspaceByIdentifier,
  getWorkspaceMemeber,
  listUserWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
