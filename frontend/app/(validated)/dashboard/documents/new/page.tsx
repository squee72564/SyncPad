export default function NewDocumentPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Document</h1>
        <p className="text-sm text-muted-foreground">
          Start a fresh document with collaborative editing, version history, and AI assistance.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Document composer coming soon. This screen will host the rich text/CRDT editor, workspace
        permissions, and AI-powered scaffolding tools.
      </div>
    </div>
  );
}
