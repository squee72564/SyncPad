import crypto from "node:crypto";
import httpStatus from "http-status";

import env from "@/config/index.js";
import prisma from "@syncpad/prisma-client";
import type {
  CreateWorkspaceArgs,
  CreateWorkspaceInviteArgs,
  GetWorkspaceMembersArgs,
  ListWorkspacesArgs,
  UpdateWorkspaceArgs,
  WorkspaceLookupField,
  WorkspaceInviteRole,
  ListWorkspaceInvitesArgs,
} from "@/types/workspace.types.ts";
import ApiError from "@/utils/ApiError.ts";
import {
  Prisma,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "@generated/prisma-postgres/index.js";

import emailService from "@/services/email.service.js";
import { normalizeSlug, normalizeEmail } from "@/utils/parse.ts";
import { buildPaginationParams, paginateItems } from "@/utils/pagination.ts";

export interface WorkspaceListItem {
  workspace: Workspace;
  membership: WorkspaceMember | null;
  effectiveRole: WorkspaceRole;
}

const INVITE_TOKEN_BYTE_LENGTH = 32;
const INVITE_EXPIRATION_HOURS = 48;

const generateInviteToken = () => crypto.randomBytes(INVITE_TOKEN_BYTE_LENGTH).toString("hex");
const calculateInviteExpiration = () => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + INVITE_EXPIRATION_HOURS);
  return expirationDate;
};

const includeInviteLinksInResponses = env.NODE_ENV !== "production";

const serializeInvite = <T extends { token: string }>(
  invite: T,
  options?: { acceptUrl?: string }
): Omit<T, "token"> & { acceptUrl?: string } => {
  const { token, ...rest } = invite;

  if (!includeInviteLinksInResponses) {
    return rest;
  }

  const acceptUrl = options?.acceptUrl ?? emailService.buildWorkspaceInviteAcceptUrl(token);
  return {
    ...rest,
    acceptUrl,
  };
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
      where: { slug: normalizeSlug(identifier)! },
    });
  }

  return prisma.workspace.findUnique({
    where: workspaceLookup === "slug" ? { slug: normalizeSlug(identifier)! } : { id: identifier },
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
  const pagination = buildPaginationParams({ limit: args.limit, cursor: args.cursor });

  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: args.workspaceId },
    select: {
      role: true,
      createdAt: true,
      id: true,
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
    take: pagination.take,
    ...(pagination.cursor ? { cursor: pagination.cursor, skip: pagination.skip } : {}),
  });

  const { items, nextCursor } = paginateItems(workspaceMembers, pagination.limit);

  return {
    members: items,
    nextCursor,
  };
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
  const slug = normalizeSlug(args.slug)!;

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
    data.slug = normalizeSlug(updates.slug)!;
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
  const email = normalizeEmail(args.email)!;
  await ensureUserIsNotAlreadyMember(args.workspaceId, email);

  const invite = await upsertWorkspaceInvite(args.workspaceId, email, args.role, args.invitedById);

  const workspaceInvite = await prisma.workspaceInvite.findUniqueOrThrow({
    where: { id: invite.id },
    include: {
      invitedBy: {
        select: invitedBySelect,
      },
    },
  });

  const acceptUrl = emailService.buildWorkspaceInviteAcceptUrl(workspaceInvite.token);

  return {
    invite: serializeInvite(workspaceInvite, { acceptUrl }),
    token: workspaceInvite.token,
    acceptUrl,
  };
};

const listWorkspaceInvites = async (args: ListWorkspaceInvitesArgs) => {
  const now = new Date();

  const pagination = buildPaginationParams({ limit: args.limit, cursor: args.cursor });

  const workspaceInvites = await prisma.workspaceInvite.findMany({
    where: {
      workspaceId: args.workspaceId,
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
    take: pagination.take,
    ...(pagination.cursor ? { cursor: pagination.cursor, skip: pagination.skip } : {}),
  });

  const serializedWorkspaceInvites = workspaceInvites.map((invite) => serializeInvite(invite));

  const { items, nextCursor } = paginateItems(serializedWorkspaceInvites, pagination.limit);

  return {
    workspaceInvites: items,
    nextCursor,
  };
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

  const workspaceInvite = await prisma.workspaceInvite.update({
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

  const acceptUrl = emailService.buildWorkspaceInviteAcceptUrl(workspaceInvite.token);

  return {
    invite: serializeInvite(workspaceInvite, { acceptUrl }),
    token: workspaceInvite.token,
    acceptUrl,
  };
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

const updateWorkspaceMemberRole = async (
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole
) => {
  return prisma.workspaceMember.updateMany({
    where: {
      workspaceId,
      id: memberId,
    },
    data: {
      role: newRole,
    },
  });
};

const removeWorkspaceMember = async (workspaceId: string, memberId: string) => {
  return prisma.workspaceMember.deleteMany({
    where: {
      workspaceId,
      id: memberId,
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
  createWorkspaceInvite,
  listWorkspaceInvites,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  acceptWorkspaceInvite,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
};
