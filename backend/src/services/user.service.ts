import { PublicUser, PublicUserSelect } from "../models/index.js";
import prisma from "../lib/prisma.js";
import { ListPublicUsersArgs } from "@/types/user.types.ts";

const getPublicUserById = async (id: string): Promise<PublicUser | null> => {
  return prisma.user.findUnique({
    where: { id },
    select: PublicUserSelect,
  });
};

const listPublicUsers = async (args: ListPublicUsersArgs): Promise<PublicUser[]> => {
  const { limit, offset, role, sort } = args || {};

  const users = prisma.user.findMany({
    where: {
      role: role || "user",
    },
    select: PublicUserSelect,
    take: limit ? parseInt(limit) : 10,
    skip: offset ? parseInt(offset) : 0,
    orderBy: { createdAt: sort || "asc" },
  });

  return users;
};

export default {
  getPublicUserById,
  listPublicUsers,
};
