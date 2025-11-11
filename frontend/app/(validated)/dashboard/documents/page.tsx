import Link from "next/link";

import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "./DocumentList";
import { Button } from "@/components/ui/button";

export default async function DocumentsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Documents</h1>
          <p className="text-sm text-muted-foreground">
            Select a workspace to browse its documents or create a new one to get started.
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
  const documents = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">All Documents</h1>
        <p className="text-sm text-muted-foreground">
          Browse every document within{" "}
          <span className="font-medium">{activeWorkspace.workspace.name}</span>, grouped by
          hierarchy and status.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <DocumentList documents={documents} />
      </div>
    </div>
  );
}
