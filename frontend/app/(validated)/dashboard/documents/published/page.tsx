import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "../DocumentList";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import PageHeader from "@/components/PageHeader";

const pageTextData = {
  title: "Published Documents",
  description: "Browse Published Documents.",
};

export default async function PublishedDocumentsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
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
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      <DocumentList documents={published} />
    </div>
  );
}
