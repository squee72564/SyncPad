import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import { getDocument } from "@/lib/documents";
import { resolveActiveWorkspace } from "@/lib/workspaces";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title="No Workspace Selected"
        description="Select a workspace to browse its documents or create a new one to get started."
        body="You do not an active workspace. Choose one from the sidebar or create a new workspace to begin organizhaveing documents."
      />
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
