"use server";

import PageHeader from "@/components/PageHeader";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import ThreadList from "./ThreadList";
import { formatError } from "@/lib/utils";
import { listAiChatThreads, AiChatThreadRecord } from "@/lib/ai-chat-thread";
import { PaginatedResult } from "@/lib/types";
import { resolveActiveWorkspace } from "@/lib/workspaces";

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

  let threadsData: PaginatedResult<AiChatThreadRecord> | null = null;
  let fetchError: string | null = null;

  try {
    threadsData = await listAiChatThreads(
      activeWorkspace.workspace.id,
      activeWorkspace.workspace.slug,
      {
        limit: 10,
      }
    );
  } catch (error) {
    fetchError = formatError(error, "Unable to load chat threads");
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      {fetchError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <ThreadList
          workspaceName={activeWorkspace.workspace.name}
          threads={threadsData?.data ?? []}
          nextCursor={threadsData?.nextCursor ?? null}
        />
      )}
    </div>
  );
}
