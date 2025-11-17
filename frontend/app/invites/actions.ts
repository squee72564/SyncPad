"use server";

import { acceptWorkspaceInvite } from "@/lib/invites";
import { formatError, ActionResult } from "@/lib/utils";
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

export async function acceptInviteAction(
  token: string
): Promise<ActionResult<{ workspaceName: string | null; workspaceId: string }>> {
  try {
    const acceptResult = await acceptWorkspaceInvite(token);

    const { workspaces } = await getWorkspaces({ includeMembership: true });
    const joinedWorkspace = workspaces.find(
      (entry: WorkspaceSummary) => entry.workspace.id === acceptResult.workspaceId
    );

    return {
      success: true,
      data: {
        workspaceName: joinedWorkspace?.workspace.name ?? null,
        workspaceId: acceptResult.workspaceId,
      },
    };
  } catch (error) {
    return { success: false, error: formatError(error, "Failed to accept invite") };
  }
}
