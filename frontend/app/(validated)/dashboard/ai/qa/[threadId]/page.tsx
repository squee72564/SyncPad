import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import { AiChatThreadRecord, getAiChatThread } from "@/lib/ai-chat-thread";
import { AiChatMessageRecord, listAiChatMessages } from "@/lib/ai-chat-message";
import { PaginatedResult } from "@/lib/types";
import { formatError } from "@/lib/utils";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import QaChat from "./QaChat";
import { redirect } from "next/navigation";

type QAChatThreadPageProps = {
  threadId: string;
};

const pageTextData = {
  title: "Chat Thread",
  description: "Chat with AI about information in your workspace.",
};

export default async function QAChatThreadPage({
  params,
}: {
  params: Promise<QAChatThreadPageProps> | QAChatThreadPageProps;
}) {
  const awaitedParams = params instanceof Promise ? await params : params;
  const { threadId } = awaitedParams;
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="You do not have an active workspace. Choose one from the sidebar or create a new workspace to begin chatting."
      />
    );
  }

  let thread: AiChatThreadRecord | null = null;
  let messages: PaginatedResult<AiChatMessageRecord> | null = null;
  let fetchError: string | null = null;

  try {
    [thread, messages] = await Promise.all([
      getAiChatThread(activeWorkspace.workspace.id, activeWorkspace.workspace.slug, threadId),
      listAiChatMessages(activeWorkspace.workspace.id, activeWorkspace.workspace.slug, threadId, {
        limit: 50,
      }),
    ]);
  } catch (error) {
    fetchError = formatError(error, "Unable to load chat thread");
  }

  if (!thread || !messages) {
    redirect("/dashboard/ai/qa");
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {fetchError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <QaChat
          workspaceId={activeWorkspace.workspace.id}
          threadId={threadId}
          threadTitle={thread.title ?? "Untitled chat"}
          workspaceName={activeWorkspace.workspace.name}
          initialMessages={messages.data}
          nextCursor={messages.nextCursor}
        />
      )}
    </div>
  );
}
