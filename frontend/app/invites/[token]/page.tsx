import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { CheckCircle2, AlertTriangle } from "lucide-react";

import getSession from "@/lib/getSession";
import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "../actions";
import { getWorkspaces } from "@/lib/workspaces";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

const buildRedirectTarget = (token: string) => `/invites/${encodeURIComponent(token)}`;

export default async function InviteAcceptPage({ params }: InvitePageProps) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  const session = await getSession();
  const redirectTarget = buildRedirectTarget(token);

  if (!session?.user) {
    const headersList = await headers();
    const origin =
      headersList.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";
    const signinUrl = new URL("/signin", origin);
    signinUrl.searchParams.set("redirect", redirectTarget);
    redirect(signinUrl.toString());
  }

  const result = await acceptInviteAction(token);

  const { workspaces } = await getWorkspaces({ includeMembership: true });
  const workspaceName =
    result.success &&
    workspaces.find((entry) => entry.workspace.id === result.workspaceId)?.workspace.name;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background/70 to-muted px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border bg-background/95 p-8 text-center shadow-xl">
        {result.success ? (
          <div className="space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Invite accepted
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Welcome{workspaceName ? ` to ${workspaceName}` : ""}!
              </h1>
              <p className="text-sm text-muted-foreground">
                Your workspace access is ready. Head to the dashboard to start collaborating with
                your team.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="sm">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <AlertTriangle className="size-8" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Invite unavailable
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                We couldn’t accept that invite
              </h1>
              <p className="text-sm text-muted-foreground">
                {result.error} If you believe this is a mistake, contact the workspace owner for a
                fresh invitation.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signin">Switch account</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
