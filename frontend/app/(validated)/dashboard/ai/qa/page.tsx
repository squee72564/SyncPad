export default function AiQaPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workspace Q&amp;A</h1>
        <p className="text-sm text-muted-foreground">
          Ask SyncPad natural-language questions and receive answers grounded in workspace docs.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Conversational interface coming soon. This experience will blend retrieval-augmented responses
        with document citations.
      </div>
    </div>
  );
}
