import CreateWorkspaceForm from "../CreateWorkspaceForm";

export default function NewWorkspacePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Spin up a new SyncPad workspace for a team, project, or client engagement.
        </p>
      </div>
      <CreateWorkspaceForm />
    </div>
  );
}
