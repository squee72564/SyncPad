import { z } from "zod";
import { roles as definedRoles } from "../lib/permissions.js";

const getUserWithSession = z.object({});

const getUserById = z.object({
  params: z.object({
    id: z.string(),
  }),
});

const listPublicUsers = z.object({
  query: z
    .object({
      limit: z.string().optional(),
      offset: z.string().optional(),
      role: z.enum(definedRoles).optional(),
      sort: z.enum(["asc", "desc"]).optional(),
    })
    .optional(),
});

export default {
  getUserWithSession,
  getUserById,
  listPublicUsers,
};
