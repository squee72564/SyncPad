import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "../DocumentList";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";

export default async function PublishedDocumentsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title="Published Documents"
        description="Choose a workspace to review the documents that are published and ready for your team."
        body="To see published docs, pick a workspace from the sidebar or create one to start publishing content."
      />
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
    <div className="flex flex-col gap-4 p-6 w-full">
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
