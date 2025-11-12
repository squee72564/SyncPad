"use server";

import { revalidatePath } from "next/cache";

import { signOut } from "@/lib/auth-client";
import { clearActiveWorkspaceSelection } from "@/lib/workspaces";

const DASHBOARD_PATH = "/dashboard";

export async function logout() {
  await signOut();
  await clearActiveWorkspaceSelection();
  revalidatePath(DASHBOARD_PATH);
}
