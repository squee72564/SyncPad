import Link from "next/link";

import { Button } from "@/components/ui/button";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import { getWorkspaceInvites, type WorkspaceInviteRecord } from "@/lib/invites";
import InviteComposer from "./InviteComposer";
import InviteList from "./InviteList";

const INVITE_ROLES = new Set(["OWNER", "ADMIN", "SUPERADMIN"]);

export default async function InvitesPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invites &amp; Access</h1>
          <p className="text-sm text-muted-foreground">
            Choose a workspace to manage invitations and monitor pending access requests.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          <p className="mb-4">
            You do not have an active workspace. Choose one from the sidebar or create a new workspace to begin inviting collaborators.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/workspaces/new">Create workspace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canManageInvites = INVITE_ROLES.has(activeWorkspace.effectiveRole);
  const workspaceId = activeWorkspace.workspace.id;

  let invites: WorkspaceInviteRecord[] = [];
  let invitesError: string | null = null;

  if (canManageInvites) {
    try {
      invites = await getWorkspaceInvites(workspaceId);
    } catch (error) {
      invitesError =
        error instanceof Error ? error.message : "Unable to load pending invites right now.";
    }
  }

  const showDevHint = process.env.NODE_ENV !== "production";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invites &amp; Access</h1>
        <p className="text-sm text-muted-foreground">
          {canManageInvites
            ? `Manage invitations for ${activeWorkspace.workspace.name}. Send new invites, resend links, or revoke access as needed.`
            : "You need an owner or admin role in this workspace to send or manage invites."}
        </p>
      </div>

      {canManageInvites ? (
        <InviteComposer workspaceId={workspaceId} />
      ) : (
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          You currently have a {activeWorkspace.effectiveRole.toLowerCase()} role in this workspace.
          Ask an owner or admin to send invites on your behalf if you need to add collaborators.
        </div>
      )}

      {showDevHint && canManageInvites ? (
        <p className="text-xs text-muted-foreground">
          Dev mode: invite links appear below when email delivery is disabled so you can copy them
          manually.
        </p>
      ) : null}

      {canManageInvites ? (
        invitesError ? (
          <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
            {invitesError}
          </div>
        ) : (
          <InviteList workspaceId={workspaceId} invites={invites} canManage={canManageInvites} />
        )
      ) : null}
    </div>
  );
}
