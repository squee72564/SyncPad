export default function ShareLinksPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Share Links</h1>
        <p className="text-sm text-muted-foreground">
          Audit public and guest access tokens tied to workspace documents and revoke access when needed.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Share link controls coming soon. The data will map directly to the `DocumentShareLink` records
        with expiration and permission metadata.
      </div>
    </div>
  );
}
