import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "../DocumentList";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";

export default async function DocumentDraftsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title="Drafts"
        description="Select a workspace to review drafts that are still in progress."
        body="Drafts are scoped to a workspace. Pick one from the sidebar or create a new workspace to continue."
      />
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
