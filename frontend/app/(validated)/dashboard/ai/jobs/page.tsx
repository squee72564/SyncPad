export default function AiJobsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Job Queue</h1>
        <p className="text-sm text-muted-foreground">
          Inspect embedding, summarization, and Q&amp;A tasks running against workspace content.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Queue insights coming soon. This screen will list `AiJob` records with status, latency, and retry
        controls.
      </div>
    </div>
  );
}
