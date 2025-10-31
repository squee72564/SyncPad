export default function DocumentDraftsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Drafts</h1>
        <p className="text-sm text-muted-foreground">
          Track documents still in progress before they graduate to review or publication.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Drafts dashboard coming soon. Expect filters for author, last edit, and review readiness
        pulled from the `DocumentStatus` field.
      </div>
    </div>
  );
}
