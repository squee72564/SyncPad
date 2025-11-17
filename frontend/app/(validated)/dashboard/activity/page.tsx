"use server";

import PageHeader from "@/components/PageHeader";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import ActivityTimeline from "./ActivityTimeline";
import { listActivityLogs } from "@/lib/activity-log";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import { formatError } from "@/lib/utils";

const pageTextData = {
  title: "Activity Log",
  description: "Trace edits, invites, and AI events across the workspace timeline.",
};

export default async function ActivityPage() {
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

  let activityData: Awaited<ReturnType<typeof listActivityLogs>> | null = null;
  let fetchError: string | null = null;

  try {
    activityData = await listActivityLogs(activeWorkspace.workspace.id, { limit: 50 });
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
          activityLogs={activityData?.activityLogs ?? []}
        />
      )}
    </div>
  );
}
