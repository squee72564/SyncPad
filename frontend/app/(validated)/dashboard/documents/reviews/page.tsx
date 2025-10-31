export default function DocumentReviewsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review Threads</h1>
        <p className="text-sm text-muted-foreground">
          Surface open comment threads and resolutions so teams can clear feedback quickly.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Review insights coming soon. We&apos;ll aggregate `DocumentComment` threads by status to
        show blockers and highlight resolved discussions.
      </div>
    </div>
  );
}
