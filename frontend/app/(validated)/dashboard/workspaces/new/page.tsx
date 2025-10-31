export default function NewWorkspacePage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Spin up a new SyncPad workspace for a team, project, or client engagement.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Workspace creation flow coming soon. You&apos;ll define the name, slug, default roles, and storage plan
        before inviting collaborators.
      </div>
    </div>
  );
}
