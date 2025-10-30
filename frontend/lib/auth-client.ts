import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3001/v1/auth",
});

export const { signIn, signOut, signUp, useSession } = authClient;
