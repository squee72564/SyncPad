import Link from "next/link";

import { Button } from "@/components/ui/button";

type WorkspaceSelectionPromptProps = {
  title: string;
  description: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export default function WorkspaceSelectionPrompt({
  title,
  description,
  body,
  ctaHref = "/dashboard/workspaces/new",
  ctaLabel = "Create workspace",
}: WorkspaceSelectionPromptProps) {
  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        <p className="mb-4">{body}</p>
        <Button asChild size="sm">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
