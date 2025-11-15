import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import { getDocumentWithCollabState } from "@/lib/documents";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import { DocumentStatusBadge } from "../DocumentStatusBadge";
import DocumentEditor from "./DocumentEditor";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title="No Workspace Selected"
        description="Select a workspace to browse its documents or create a new one to get started."
        body="You do not have an active workspace. Choose one from the sidebar or create a new workspace to begin organizing documents."
      />
    );
  }

  const { document, collabState } = await getDocumentWithCollabState(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug,
    id
  );

  const isDraft = document.status === "DRAFT";

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{document.title}</h1>
          <DocumentStatusBadge status={document.status} />
        </div>
        {document.headline ? (
          <p className="text-lg text-muted-foreground">{document.headline}</p>
        ) : null}
        {document.summary ? (
          <p className="text-sm text-muted-foreground">{document.summary}</p>
        ) : null}
        {!isDraft ? (
          <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            This document is in <span className="font-semibold">{document.status}</span> status and
            is read-only. Update the status to Draft to continue editing.
          </div>
        ) : null}
      </div>

      <DocumentEditor document={document} collabState={collabState} readOnly={!isDraft} />
    </div>
  );
}
