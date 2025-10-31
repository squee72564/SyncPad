export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All Documents</h1>
        <p className="text-sm text-muted-foreground">
          Browse every document within the current workspace, grouped by hierarchy and status.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Document explorer coming soon. This page will surface the `Document` tree, last edited metadata,
        and quick filters for status, owner, and tags.
      </div>
    </div>
  );
}
