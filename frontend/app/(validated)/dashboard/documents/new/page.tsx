import Link from "next/link";

import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import { CreateDocumentForm } from "../CreateDocumentForm";
import { Button } from "@/components/ui/button";

export default async function NewDocumentPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col gap-4 p-6 w-full">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Document</h1>
          <p className="text-sm text-muted-foreground">
            Choose a workspace before drafting a new document.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          <p className="mb-4">
            Documents live inside a workspace. Pick one from the sidebar or create a new workspace
            first.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/workspaces/new">Create workspace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const existingDocuments = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug
  );

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create Document</h1>
        <p className="text-sm text-muted-foreground">
          Start a fresh document inside{" "}
          <span className="font-medium">{activeWorkspace.workspace.name}</span>.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <CreateDocumentForm documents={existingDocuments} />
      </div>
    </div>
  );
}
