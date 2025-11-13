import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "./DocumentList";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import PageHeader from "@/components/PageHeader";

const pageTextData = {
  title: "All Documents",
  description: "Browse All Documents.",
};

export default async function DocumentsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="You do not have an active workspace. Choose one from the sidebar or create a new workspace to begin organizing documents."
      />
    );
  }
  const documents = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug
  );

  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      <DocumentList documents={documents} />
    </div>
  );
}
