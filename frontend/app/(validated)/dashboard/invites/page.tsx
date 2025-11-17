import { resolveActiveWorkspace } from "@/lib/workspaces";
import { getWorkspaceInvites, type WorkspaceInviteRecord } from "@/lib/invites";
import InviteComposer from "./InviteComposer";
import InviteList from "./InviteList";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import PageHeader from "@/components/PageHeader";
import { formatError } from "@/lib/utils";

const INVITE_ROLES = new Set(["OWNER", "ADMIN", "SUPERADMIN"]);

const pageTextData = {
  title: "Invites & Access",
  description: "Manage workspace invitations and monitor pending access requests.",
};

export default async function InvitesPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="You do not have an active workspace. Choose one from the sidebar or create a new workspace to begin inviting collaborators."
      />
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
      invitesError = formatError(error, "Unable to load pending invites right now.");
    }
  }

  const showDevHint = process.env.NODE_ENV !== "production";

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />

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
