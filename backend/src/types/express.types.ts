import { User, Session } from "better-auth";
import { SessionWithImpersonatedBy, UserWithRole } from "better-auth/plugins";
import type { WorkspaceContext } from "./workspace.types.ts";

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace Express {
    interface Request {
      session?: Session & SessionWithImpersonatedBy;
      user?: User & UserWithRole;
      workspaceContext?: WorkspaceContext;
    }
  }
}

export {}; // Ensure this file is treated as a module
