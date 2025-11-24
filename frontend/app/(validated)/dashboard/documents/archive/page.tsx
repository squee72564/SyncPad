"use server";

import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import DocumentList from "../DocumentList";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import PageHeader from "@/components/PageHeader";

const pageTextData = {
  title: "Archives",
  description: "Browse Archived Documents.",
};

export default async function DocumentArchivePage() {
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

  const { data: activeWorkspaces, nextCursor: _nextCursor } = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug,
    {
      status: "ARCHIVED",
    }
  );

  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      <DocumentList documents={activeWorkspaces} />
    </div>
  );
}
