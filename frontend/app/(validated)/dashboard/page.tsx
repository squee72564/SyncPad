import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";

import { getWorkspaces } from "@/lib/workspaces";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import WorkspaceActions from "./workspaces/WorkspaceActions";
import ViewDocumentsButton from "./workspaces/ViewDocumentsButton";
import PageHeader from "@/components/PageHeader";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  COMMENTER: "Commenter",
  VIEWER: "Viewer",
  SUPERADMIN: "Super Admin",
  ANONYMOUS: "Guest",
};

const formatRole = (role: string | undefined) => roleLabels[role ?? ""] ?? role ?? "Member";

export default async function DashboardPage() {
  const { workspaces } = await getWorkspaces({ includeMembership: true });

  if (workspaces.length === 0) {
    return (
      <WorkspaceSelectionPrompt
        title="Workspace Overview"
        description="Access the workspaces you belong to, review your role, and jump into the areas you manage."
        body="You do not belong to any workspaces yet. Create a new workspace to start organizing documents, invite teammates, and manage roles."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <PageHeader
        header="Workspace Overview"
        body="Access the workspaces you belong to, review your role, and jump into the areas you manage."
      >
        <Button asChild>
          <Link href="/dashboard/workspaces/new" className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create workspace
          </Link>
        </Button>
      </PageHeader>
      <div className="grid gap-4">
        {workspaces.map((entry) => {
          const createdAt = new Date(entry.workspace.createdAt);
          const memberRole = entry.membership?.role ?? entry.effectiveRole;

          return (
            <Card key={entry.workspace.id}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold md:text-xl">
                  {entry.workspace.name}
                </CardTitle>
                <CardDescription className="text-sm max-w-full truncate">
                  <span>{entry.workspace.description || "No description provided."}</span>
                </CardDescription>
                <CardAction>
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium uppercase text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" />
                    {formatRole(memberRole)}
                  </span>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                <div className="grid gap-1">
                  <span className="font-medium text-foreground">Slug</span>
                  <span className="font-mono text-xs md:text-sm">{entry.workspace.slug}</span>
                </div>
                <div className="grid gap-1">
                  <span className="font-medium text-foreground">Joined</span>
                  <span>{createdAt.toLocaleDateString()}</span>
                </div>
                {entry.membership ? (
                  <span className="text-xs text-muted-foreground">
                    Membership role: {formatRole(entry.membership.role)}
                  </span>
                ) : null}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <ViewDocumentsButton workspace={entry.workspace} />
                  <WorkspaceActions summary={entry} />
                </div>
                <span
                  className={cn(
                    "text-xs text-muted-foreground truncate",
                    "uppercase tracking-tight"
                  )}
                >
                  Workspace ID: {entry.workspace.id}
                </span>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
