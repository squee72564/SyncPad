import Link from "next/link";

import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "../DocumentList";
import { Button } from "@/components/ui/button";

export default async function PublishedDocumentsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Published Documents</h1>
          <p className="text-sm text-muted-foreground">
            Choose a workspace to review the documents that are published and ready for your team.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          <p className="mb-4">
            To see published docs, pick a workspace from the sidebar or create one to start
            publishing content.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/workspaces/new">Create workspace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const published = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug,
    {
      status: "PUBLISHED",
    }
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Published Documents</h1>
        <p className="text-sm text-muted-foreground">
          Browse content that&apos;s published within{" "}
          <span className="font-medium">{activeWorkspace.workspace.name}</span>.
        </p>
      </div>
      <DocumentList documents={published} />
    </div>
  );
}
