import Link from "next/link";

import { Button } from "@/components/ui/button";
import { previewShareLink } from "@/lib/share-links";

type ShareLinkLandingProps = {
  params: Promise<{ token: string }>;
};

export default async function ShareLinkLanding({ params }: ShareLinkLandingProps) {
  const { token } = await params;
  const preview = await previewShareLink(token);

  if (!preview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
        <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-destructive">Link unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This share link is invalid or has expired. Ask the document owner for a fresh invite.
          </p>
        </div>
      </div>
    );
  }

  const dashboardUrl = `/dashboard?shareToken=${encodeURIComponent(token)}&documentId=${preview.document.id}`;
  const signinUrl = `/signin?redirect=${encodeURIComponent(dashboardUrl)}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background/70 to-muted px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border bg-background/95 p-8 text-center shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Document share link
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {preview.document.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Shared from <span className="font-medium">{preview.workspace.name}</span> with
          <span className="font-medium"> {preview.permission.toLowerCase()}</span> access.
        </p>
        <div className="mt-6 space-y-1 text-sm text-muted-foreground">
          <p>
            Token: <span className="font-mono text-xs">{token}</span>
          </p>
          <p>Expires {preview.expiresAt ? new Date(preview.expiresAt).toLocaleString() : "Never"}</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={dashboardUrl}>Open in Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={signinUrl}>Sign in to continue</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
