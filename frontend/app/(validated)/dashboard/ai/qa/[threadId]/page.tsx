import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import { resolveActiveWorkspace } from "@/lib/workspaces";
import QaChat from "./QaChat";

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
  params: Promise<QAChatThreadPageProps>;
}) {
  const { threadId } = await params;
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

  // Do some server action to get the messages using this workspaceId and threadId

  return (
    <>
      {/*
      Render the chat for this thread passing in all the
      initial messages from previous chatting sessions
      and whatever other info we need
      */}
      <QaChat
        workspaceId={activeWorkspace.workspace.id}
        threadId={threadId}
        workspaceName={activeWorkspace.workspace.name}
        history={[]} // We need to pass the current history here, and also let this component update it as we go along
      />
    </>
  );
}
