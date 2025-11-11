import { Button } from "@/components/ui/button";
import { getDocument } from "@/lib/documents";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import Link from "next/link";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">No Workspace Selected</h1>
          <p className="text-sm text-muted-foreground">
            Select a workspace to browse its documents or create a new one to get started.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          <p className="mb-4">
            You do not an active workspace. Choose one from the sidebar or create a new workspace to
            begin organizhaveing documents.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/workspaces/new">Create workspace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const document = await getDocument(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug,
    id
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{document.title}</h1>
        <p>{document.headline}</p>
        <p className="text-sm text-muted-foreground">{document.summary}</p>
      </div>
    </div>
  );
}
