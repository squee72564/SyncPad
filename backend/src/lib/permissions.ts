import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const defaultRoles = ["user"] as const;
export const adminRoles = ["admin", "superAdmin"] as const;
export const roles = [...defaultRoles, ...adminRoles] as const;

const statement = {
  ...defaultStatements,
  publicUser: ["listPublicUsers"],
} as const;

export const ac = createAccessControl(statement);

export const superAdmin = ac.newRole({
  ...adminAc.statements,
  publicUser: ["listPublicUsers"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  publicUser: ["listPublicUsers"],
});

export const user = ac.newRole({
  publicUser: ["listPublicUsers"],
});
