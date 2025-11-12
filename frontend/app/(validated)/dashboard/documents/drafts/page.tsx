import Link from "next/link";

import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "../DocumentList";
import { Button } from "@/components/ui/button";

export default async function DocumentDraftsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col gap-4 p-6 w-full">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drafts</h1>
          <p className="text-sm text-muted-foreground">
            Select a workspace to review drafts that are still in progress.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          <p className="mb-4">
            Drafts are scoped to a workspace. Pick one from the sidebar or create a new workspace to
            continue.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/workspaces/new">Create workspace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const drafts = await listDocuments(activeWorkspace.workspace.id, activeWorkspace.workspace.slug, {
    status: "DRAFT",
  });

  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Drafts</h1>
        <p className="text-sm text-muted-foreground">
          Track documents in progress within{" "}
          <span className="font-medium">{activeWorkspace.workspace.name}</span>.
        </p>
      </div>
      <DocumentList documents={drafts} />
    </div>
  );
}
