export default function AiEmbeddingsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vector Library</h1>
        <p className="text-sm text-muted-foreground">
          Explore embeddings generated for workspace documents and drill into chunk-level metadata.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Embedding explorer coming soon. We&apos;ll expose data from the `DocumentEmbedding` table
        alongside vector store sync health.
      </div>
    </div>
  );
}
