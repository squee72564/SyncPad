import prisma from "../lib/prisma.js";
import type {
  CreateWorkspaceArgs,
  GetWorkspaceMembersArgs,
  ListWorkspacesArgs,
  UpdateWorkspaceArgs,
  WorkspaceLookupField,
} from "@/types/workspace.types.ts";
import {
  Prisma,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "../../prisma/generated/prisma-postgres/index.js";
import ApiError from "@/utils/ApiError.ts";
import httpStatus from "http-status";

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

const getWorkspaceMembers = async (args: GetWorkspaceMembersArgs) => {
  return prisma.workspaceMember.findMany({
    where: { workspaceId: args.workspaceId },
    select: {
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
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

export const createWorkspace = async (
  args: CreateWorkspaceArgs,
  userId: string
): Promise<WorkspaceListItem> => {
  const slug = normalizeSlug(args.slug);

  try {
    return await prisma.$transaction(async (tx) => {
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(httpStatus.CONFLICT, `A workspace with slug "${slug}" already exists.`);
    }
    throw err;
  }
};

const updateWorkspace = async (workspaceId: string, updates: UpdateWorkspaceArgs) => {
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
  prisma.workspace.delete({
    where: { id: workspaceId },
  });
};

const inviteUserToWorkspace = async (
  workspaceId: string,
  invitedUserEmail: string,
  userId: string,
  token: string,
  role: "ADMIN" | "VIEWER" | "EDITOR" | "COMMENTER"
) => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 24);

  return prisma.workspaceInvite.create({
    data: {
      workspaceId,
      email: invitedUserEmail,
      token: token,
      role: role,
      invitedById: userId,
      expiresAt: expirationDate,
    },
  });
};

export default {
  getWorkspaceByIdentifier,
  getWorkspaceMemeber,
  getWorkspaceMembers,
  listUserWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteUserToWorkspace,
};
