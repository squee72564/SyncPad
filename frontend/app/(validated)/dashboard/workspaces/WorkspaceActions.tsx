"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { deleteWorkspaceAction, updateWorkspaceAction } from "./actions";
import { WorkspaceSummary } from "@/lib/workspaces";

type WorkspaceActionsProps = {
  summary: WorkspaceSummary;
};

export default function WorkspaceActions({ summary }: WorkspaceActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: summary.workspace.name,
    slug: summary.workspace.slug,
    description: summary.workspace.description ?? "",
  });
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setFormState({
      name: summary.workspace.name,
      slug: summary.workspace.slug,
      description: summary.workspace.description ?? "",
    });
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateWorkspaceAction({
        workspaceId: summary.workspace.id,
        name: formState.name,
        slug: formState.slug,
        description: formState.description,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Workspace updated");
      setOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete workspace “${summary.workspace.name}”? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteWorkspaceAction(summary.workspace.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Workspace deleted");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          resetForm();
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
          <Pencil className="h-4 w-4" />
          Manage
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-6 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit workspace</SheetTitle>
          <SheetDescription>
            Update workspace metadata or remove it entirely. Changes take effect immediately for
            everyone with access.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleUpdate} className="flex flex-1 flex-col gap-4 p-5 overflow-y-auto">
          <div className="grid gap-2">
            <Label htmlFor={`workspace-name-${summary.workspace.id}`}>Name</Label>
            <Input
              id={`workspace-name-${summary.workspace.id}`}
              value={formState.name}
              disabled={isPending}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`workspace-slug-${summary.workspace.id}`}>Slug</Label>
            <Input
              id={`workspace-slug-${summary.workspace.id}`}
              value={formState.slug}
              disabled={isPending}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  slug: event.target.value.toLowerCase(),
                }))
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and dashes only.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`workspace-description-${summary.workspace.id}`}>Description</Label>
            <Textarea
              id={`workspace-description-${summary.workspace.id}`}
              value={formState.description}
              disabled={isPending}
              rows={4}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              maxLength={512}
            />
          </div>

          <SheetFooter className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              className="inline-flex items-center gap-1"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" /> Delete workspace
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
