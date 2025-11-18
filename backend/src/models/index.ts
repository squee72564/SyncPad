import {
  User,
  Session,
  Account,
  Verification,
} from "../../../prisma/generated/prisma-postgres/index.js";

// The generated prisma client creates types for each model in the schema.prisma file.
// You can export them here for easy access throughout your codebase.

// If you add new models to your schema.prisma file, remember to run `npx prisma generate`
// to update the generated client and then add the new models to this export list.

type PublicUser = Omit<
  User,
  "email" | "emailVerified" | "banned" | "banReason" | "banExpires" | "updatedAt"
>;

export const PublicUserSelect = {
  id: true,
  name: true,
  image: true,
  createdAt: true,
  role: true,
} as const;

export type { PublicUser, User, Session, Account, Verification };
