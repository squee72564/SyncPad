import crypto from "node:crypto";

import prisma from "../lib/prisma.js";
import type {
  CreateWorkspaceArgs,
  CreateWorkspaceInviteArgs,
  GetWorkspaceMembersArgs,
  ListWorkspacesArgs,
  UpdateWorkspaceArgs,
  WorkspaceLookupField,
  WorkspaceInviteRole,
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

const INVITE_TOKEN_BYTE_LENGTH = 32;
const INVITE_EXPIRATION_HOURS = 48;

const normalizeSlug = (slug: string) => slug.trim().toLowerCase();
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const generateInviteToken = () => crypto.randomBytes(INVITE_TOKEN_BYTE_LENGTH).toString("hex");
const calculateInviteExpiration = () => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + INVITE_EXPIRATION_HOURS);
  return expirationDate;
};
const invitedBySelect = { id: true, name: true, email: true } as const;

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
  return prisma.workspace.delete({
    where: { id: workspaceId },
  });
};

const ensureUserIsNotAlreadyMember = async (workspaceId: string, email: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!existingUser) {
    return;
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: existingUser.id,
      },
    },
  });

  if (existingMembership) {
    throw new ApiError(httpStatus.CONFLICT, "User is already a member of this workspace");
  }
};

const upsertWorkspaceInvite = async (
  workspaceId: string,
  email: string,
  role: WorkspaceInviteRole,
  invitedById: string
) => {
  const now = new Date();

  const activeInvite = await prisma.workspaceInvite.findFirst({
    where: {
      workspaceId,
      email,
      acceptedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  const data = {
    workspaceId,
    email,
    role,
    invitedById,
    token: generateInviteToken(),
    expiresAt: calculateInviteExpiration(),
  };

  if (activeInvite) {
    return prisma.workspaceInvite.update({
      where: { id: activeInvite.id },
      data,
    });
  }

  // Handle the rare case of token collisions by retrying once.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.workspaceInvite.create({
        data,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt === 0
      ) {
        data.token = generateInviteToken();
        continue;
      }
      throw err;
    }
  }

  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Unable to create workspace invite");
};

const createWorkspaceInvite = async (
  args: Omit<CreateWorkspaceInviteArgs, "workspaceId"> & {
    workspaceId: string;
    invitedById: string;
  }
) => {
  const email = normalizeEmail(args.email);
  await ensureUserIsNotAlreadyMember(args.workspaceId, email);

  const invite = await upsertWorkspaceInvite(args.workspaceId, email, args.role, args.invitedById);

  return prisma.workspaceInvite.findUniqueOrThrow({
    where: { id: invite.id },
    include: {
      invitedBy: {
        select: invitedBySelect,
      },
    },
  });
};

const listWorkspaceInvites = async (workspaceId: string) => {
  const now = new Date();
  return prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      acceptedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      invitedBy: {
        select: invitedBySelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getWorkspaceInviteOrThrow = async (workspaceId: string, inviteId: string) => {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
    include: {
      invitedBy: {
        select: invitedBySelect,
      },
    },
  });

  if (!invite || invite.workspaceId !== workspaceId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Workspace invite not found");
  }

  if (invite.acceptedAt) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Workspace invite has already been accepted");
  }

  return invite;
};

const resendWorkspaceInvite = async (
  workspaceId: string,
  inviteId: string,
  invitedById: string
) => {
  await getWorkspaceInviteOrThrow(workspaceId, inviteId);

  return prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: {
      invitedById,
      token: generateInviteToken(),
      expiresAt: calculateInviteExpiration(),
    },
    include: {
      invitedBy: {
        select: invitedBySelect,
      },
    },
  });
};

const revokeWorkspaceInvite = async (workspaceId: string, inviteId: string) => {
  await getWorkspaceInviteOrThrow(workspaceId, inviteId);
  return prisma.workspaceInvite.delete({
    where: { id: inviteId },
  });
};

const acceptWorkspaceInvite = async (token: string, userId: string) => {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    throw new ApiError(httpStatus.NOT_FOUND, "Workspace invite not found");
  }

  if (invite.acceptedAt) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Workspace invite already accepted");
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    throw new ApiError(httpStatus.GONE, "Workspace invite has expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user || !user.email) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Authenticated user not found");
  }

  const normalizedUserEmail = normalizeEmail(user.email);

  if (normalizedUserEmail !== invite.email) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Invite email does not match the signed-in user's email"
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    let membership: WorkspaceMember;
    try {
      membership = await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        membership = await tx.workspaceMember.findUniqueOrThrow({
          where: {
            workspaceId_userId: {
              workspaceId: invite.workspaceId,
              userId: user.id,
            },
          },
        });
      } else {
        throw err;
      }
    }

    const acceptedInvite = await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: new Date(),
        token: generateInviteToken(),
      },
    });

    return { membership, invite: acceptedInvite };
  });

  return result;
};

export default {
  getWorkspaceByIdentifier,
  getWorkspaceMemeber,
  getWorkspaceMembers,
  listUserWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  createWorkspaceInvite,
  listWorkspaceInvites,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  acceptWorkspaceInvite,
};
