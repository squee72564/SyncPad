"use server";

import { Button } from "@/components/ui/button";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import Link from "next/link";
import { getWorkspaceMembersAction } from "../workspaces/actions";
import MembersActions from "./MembersActions";

export default async function MembersPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members &amp; Roles</h1>
          <p className="text-sm text-muted-foreground">
            Review workspace membership, assign roles, and track invitations tied to each seat.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          <p className="mb-4">
            You do not have an active workspace. Choose one from the sidebar or create a new
            workspace to begin organizing documents.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/workspaces/new">Create workspace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const effectiveRole = activeWorkspace.effectiveRole;
  const workspaceMembers = await getWorkspaceMembersAction(activeWorkspace.workspace.id);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members &amp; Roles</h1>
        <p className="text-sm text-muted-foreground">
          Review workspace membership, assign roles, and track invitations tied to each seat.
        </p>
      </div>
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
