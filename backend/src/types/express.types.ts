import { User, Session } from "better-auth";
import { SessionWithImpersonatedBy, UserWithRole } from "better-auth/plugins";

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace Express {
    interface Request {
      session?: Session & SessionWithImpersonatedBy;
      user?: User & UserWithRole;
    }
  }
}

export {}; // Ensure this file is treated as a module
