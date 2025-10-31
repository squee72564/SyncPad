export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground">
          Trace edits, comments, share events, and AI actions across the workspace timeline.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Activity insights coming soon. You&apos;ll see a feed powered by the `ActivityLog` model with filters
        for document, actor, and event type.
      </div>
    </div>
  );
}
