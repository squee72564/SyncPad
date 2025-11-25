"use server";

import PageHeader from "@/components/PageHeader";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import ActivityTimeline from "./AiJobTimeline";
import { AiListJobRecord, listAiJobs } from "@/lib/ai-jobs";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import { formatError } from "@/lib/utils";
import { PaginatedResult } from "@/lib/types";

const pageTextData = {
  title: "AI Job Log",
  description: "Trace AI workflows across the workspace",
};

export default async function AiJobPage() {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="Select a workspace from the sidebar or create a new one to review its activity history."
      />
    );
  }

  let aiJobData: PaginatedResult<AiListJobRecord> | null = null;
  let fetchError: string | null = null;

  try {
    aiJobData = await listAiJobs(activeWorkspace.workspace.id, { limit: 5 });
  } catch (error) {
    fetchError = formatError(error, "Unable to load activity log");
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <PageHeader header={pageTextData.title} body={pageTextData.description} />
      {fetchError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <ActivityTimeline
          workspaceId={activeWorkspace.workspace.id}
          aiJobs={aiJobData?.data ?? []}
          nextCursor={aiJobData?.nextCursor ?? null}
        />
      )}
    </div>
  );
}
