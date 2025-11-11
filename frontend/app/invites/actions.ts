"use server";

import { acceptWorkspaceInvite } from "@/lib/invites";
import { getWorkspaces, type WorkspaceSummary } from "@/lib/workspaces";

export type AcceptInviteResult =
  | {
      success: true;
      workspaceName: string | null;
      workspaceId: string;
    }
  | {
      success: false;
      error: string;
    };

export async function acceptInviteAction(token: string): Promise<AcceptInviteResult> {
  try {
    const acceptResult = await acceptWorkspaceInvite(token);

    const { workspaces } = await getWorkspaces({ includeMembership: true });
    const joinedWorkspace = workspaces.find(
      (entry: WorkspaceSummary) => entry.workspace.id === acceptResult.workspaceId
    );

    return {
      success: true,
      workspaceName: joinedWorkspace?.workspace.name ?? null,
      workspaceId: acceptResult.workspaceId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invite";
    return { success: false, error: message };
  }
}
