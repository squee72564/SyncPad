import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "./DocumentList";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";

export default async function DocumentsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title="All Documents"
        description="Select a workspace to browse its documents or create a new one to get started."
        body="You do not have an active workspace. Choose one from the sidebar or create a new workspace to begin organizing documents."
      />
    );
  }
  const documents = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug
  );

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">All Documents</h1>
        <p className="text-sm text-muted-foreground">
          Browse every document within{" "}
          <span className="font-medium">{activeWorkspace.workspace.name}</span>, grouped by
          hierarchy and status.
        </p>
      </div>
      <DocumentList documents={documents} />
    </div>
  );
}
