"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { WorkspaceSummary } from "@/lib/workspaces";
import { setActiveWorkspaceAction } from "./actions";

type ViewDocumentsButtonProps = {
  workspace: WorkspaceSummary["workspace"];
};

export default function ViewDocumentsButton({ workspace }: ViewDocumentsButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      setActiveWorkspaceAction(workspace.id)
        .then((result) => {
          if (!result.success) {
            toast.error(result.error);
            return;
          }

          toast.success("Workspace switched", {
            description: `Now viewing ${workspace.name}`,
          });

          router.push("/dashboard/documents");
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Failed to open documents";
          toast.error(message);
        });
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="inline-flex items-center gap-1"
      onClick={handleClick}
      disabled={isPending}
    >
      View documents
      <ArrowUpRight className="h-4 w-4" />
    </Button>
  );
}
