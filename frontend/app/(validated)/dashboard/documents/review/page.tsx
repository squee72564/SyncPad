import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "../DocumentList";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import PageHeader from "@/components/PageHeader";

const pageTextData = {
  title: "Drafts Under Review",
  description: "Browse Documents That Are In Review.",
};

export default async function DocumentDraftsPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="Archives are scoped to a workspace. Pick one from the sidebar or create a new workspace to continue."
      />
    );
  }

  const inReview = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug,
    {
      status: "IN_REVIEW",
    }
  );

  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      <DocumentList documents={inReview} />
    </div>
  );
}
