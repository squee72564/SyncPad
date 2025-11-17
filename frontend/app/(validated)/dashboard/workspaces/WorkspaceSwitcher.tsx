"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspaceSummary } from "@/lib/workspaces";
import { setActiveWorkspaceAction } from "./actions";
import { toast } from "sonner";
import { formatError } from "@/lib/utils";

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
};

export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeWorkspace =
    workspaces.find((workspace) => workspace.workspace.id === activeWorkspaceId) ?? null;

  const handleSelect = (workspaceId: string) => {
    if (!workspaceId || workspaceId === activeWorkspaceId) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await setActiveWorkspaceAction(workspaceId);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        const label =
          workspaces.find((entry) => entry.workspace.id === result.workspaceId)?.workspace.name ??
          result.slug;

        toast.success("Workspace switched", {
          description: `Now viewing ${label}`,
        });
        router.refresh();
      } catch (error) {
        const message = formatError(error, "Failed to switch workspace");
        toast.error(message);
      }
    });
  };

  const label =
    activeWorkspace?.workspace.name ??
    (workspaces.length > 0 ? "Select workspace" : "No workspaces");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-sidebar-accent/50 text-sidebar-foreground inline-flex w-full items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1 text-left text-sm font-medium ring-offset-background transition"
          disabled={workspaces.length === 0}
        >
          <span className="truncate">{label}</span>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ChevronsUpDown className="size-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {workspaces.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">No workspaces available</div>
        ) : (
          <DropdownMenuRadioGroup
            value={activeWorkspaceId ?? ""}
            onValueChange={handleSelect}
            className="outline-none"
          >
            {workspaces.map((entry) => (
              <DropdownMenuRadioItem key={entry.workspace.id} value={entry.workspace.id}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none">{entry.workspace.name}</span>
                  <span className="text-xs text-muted-foreground">{entry.workspace.slug}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
