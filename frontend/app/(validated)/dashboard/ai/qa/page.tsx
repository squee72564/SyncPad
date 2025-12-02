"use server";

import PageHeader from "@/components/PageHeader";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import QaChat from "./QaChat";

const pageTextData = {
  title: "Workspace Q&A",
  description: "Ask questions in natural language and get responses grounded in your documents.",
};

export default async function AiQaPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="Pick a workspace from the sidebar or create one to start asking questions."
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      <QaChat
        workspaceId={activeWorkspace.workspace.id}
        workspaceName={activeWorkspace.workspace.name}
      />
    </div>
  );
}
