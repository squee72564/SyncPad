"use server";

import { resolveActiveWorkspace } from "@/lib/workspaces";
import { getWorkspaceMembersAction } from "../workspaces/actions";
import MembersActions from "./MembersActions";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import PageHeader from "@/components/PageHeader";

const pageTextData = {
  title: "Members & Roles",
  description:
    "Review workspace membership, assign roles, and track invitations tied to each seat.",
};

export default async function MembersPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="You do not have an active workspace. Choose one from the sidebar or create a new workspace to begin organizing documents."
      />
    );
  }

  const effectiveRole = activeWorkspace.effectiveRole;
  const workspaceMembers = await getWorkspaceMembersAction(activeWorkspace.workspace.id);

  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted/40 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>User</span>
          <span>Email</span>
          <span>ROLE</span>
          {effectiveRole === "OWNER" && <span className="text-right">Edit</span>}
        </div>
        <div className="divide-y">
          {workspaceMembers.map((memberInfo) => {
            return (
              <div
                key={memberInfo.user.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm"
              >
                <span>{memberInfo.user.name}</span>
                <span className="text-xs text-muted-foreground">{memberInfo.user.email}</span>
                <span>{memberInfo.role}</span>
                {effectiveRole === "OWNER" && (
                  <MembersActions
                    id={memberInfo.id}
                    user={memberInfo.user}
                    role={memberInfo.role}
                    createdAt={memberInfo.createdAt}
                    workspaceId={activeWorkspace.workspace.id}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
