import prisma from "../lib/prisma.js";

type WorkspaceLookupField = "id" | "slug";

const getWorkspaceByIdentifier = async (workspaceLookup: WorkspaceLookupField, identifier: string) => {
    return prisma.workspace.findUnique({
        where: workspaceLookup === "slug" ? { slug: identifier } : { id: identifier },
    });
}

const getWorkspaceMemeber = async (workspaceId: string, userId: string) => {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspaceId,
        userId: userId,
      },
    },
  });
}


export default {
    getWorkspaceByIdentifier,
    getWorkspaceMemeber,
}