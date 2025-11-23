import { AuthContext, betterAuth, type User, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin } from "better-auth/plugins";
import prisma from "@syncpad/prisma-client";
import env from "@/config/index.js";
import logger from "@/config/logger.js";
import { ac, admin, superAdmin, user } from "@/lib/permissions.js";

const database = prismaAdapter(prisma, { provider: "postgresql" });

// Example to optionally include provider like github / google
const socialProviders: BetterAuthOptions["socialProviders"] = {};
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    enabled: true,
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}

const auth = betterAuth({
  database: database,
  // Other sign-in methods: https://www.better-auth.com/docs/authentication/email-password
  // https://www.better-auth.com/docs/reference/options#emailandpassword
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.NODE_ENV === "production",
    sendResetPassword: async (data: { user: User; url: string; token: string }, req?: Request) => {
      // Send reset password email
      if (env.NODE_ENV === "development") {
        logger.debug(`Better Auth Send Reset Password Callback:`, {
          data: data,
          req: req || "N/A",
        });
      }
    },
  },

  // https://www.better-auth.com/docs/reference/options#session
  session: {
    expiresIn: 604800, // 7 days
    updateAge: 86400, // 1 day
    // https://www.better-auth.com/docs/guides/optimizing-for-performance#database-optimizations
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },

  trustedOrigins: ["*"],
  basePath: "/v1/auth/",
  baseURL: "http://localhost:3000/v1/auth",

  // https://www.better-auth.com/docs/reference/options#emailverification
  emailVerification: {
    sendVerificationEmail: async (data: { user: User; url: string; token: string }) => {
      if (env.NODE_ENV === "development") {
        logger.debug(`Better Auth Verify Email Callback:`, { data: data });
      }
    },
    sendOnSignUp: env.NODE_ENV === "production",
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 hour
  },

  // https://www.better-auth.com/docs/reference/options#plugins
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
        superAdmin,
      },
      defaultRole: "user",
      adminRoles: ["admin", "superAdmin"],
    }),
  ],

  // Example for provider like github / google
  socialProviders,

  // https://www.better-auth.com/docs/reference/options#logger
  logger: {
    disabled: false,
    disableColors: false,
    level: env.NODE_ENV === "development" ? "debug" : "error",
    log: (level, message, ...args) => {
      if (env.NODE_ENV === "development") {
        if (level === "error") {
          logger.error(message, ...args);
        } else if (level === "warn") {
          logger.warn(message, ...args);
        } else if (level === "debug") {
          logger.debug(message, ...args);
        } else {
          logger.info(message, ...args);
        }
      }
    },
  },

  // https://www.better-auth.com/docs/reference/options#databasehooks
  databaseHooks: {},

  onAPIError: {
    throw: true,
    onError: async (error: unknown, _ctx: AuthContext) => {
      logger.error("Better Auth API Error:", error);
      const err = error instanceof Error ? error : new Error("Better Auth Authentication Error");
      throw err;
    },
  },
});

export default auth;
