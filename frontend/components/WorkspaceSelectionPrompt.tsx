import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import PageHeader from "./PageHeader";

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
  ctaLabel = "Start a workspace",
}: WorkspaceSelectionPromptProps) {
  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <PageHeader header={title} body={description} />
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>No workspaces yet</CardTitle>
          <CardDescription>{body}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href={ctaHref} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> {ctaLabel}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
