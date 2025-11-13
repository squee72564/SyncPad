import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import { CreateDocumentForm } from "../CreateDocumentForm";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import PageHeader from "@/components/PageHeader";

const pageTextData = {
  title: "Create Document",
  description: "Start a Fresh Document.",
};

export default async function NewDocumentPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="Documents live inside a workspace. Pick one from the sidebar or create a new workspace first."
      />
    );
  }

  const existingDocuments = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug
  );

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      <CreateDocumentForm documents={existingDocuments} />
    </div>
  );
}
