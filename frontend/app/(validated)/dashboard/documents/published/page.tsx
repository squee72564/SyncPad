export default function PublishedDocumentsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Published Documents</h1>
        <p className="text-sm text-muted-foreground">
          Browse the canonical, published content that&apos;s ready for consumption across the
          workspace.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Published library coming soon. This view will highlight review history, publication dates,
        and share visibility.
      </div>
    </div>
  );
}
