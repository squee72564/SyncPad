"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getWorkspaceMembersResult } from "@/lib/workspaces";
import { removeWorkspaceMemberAction, updateWorkspaceMemberRoleAction } from "./actions";

type MembersActionsProps = getWorkspaceMembersResult & {
  workspaceId: string;
};

export default function MembersActions({ user, role, id, workspaceId }: MembersActionsProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState({
    role: role,
  });
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setFormState({
      role: role,
    });
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formState.role === role) {
      toast.info("No changes detected");
      return;
    }

    startTransition(async () => {
      const result = await updateWorkspaceMemberRoleAction({
        workspaceId,
        memberId: id,
        role: formState.role,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Member role updated");
      setOpen(false);
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm(`Remove user from  workspace? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await removeWorkspaceMemberAction({
        workspaceId,
        memberId: id,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Member removed");
      setOpen(false);
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
        <Button
          variant="outline"
          size="sm"
          className="inline-flex items-center"
          disabled={role === "OWNER"}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-6 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit User Role</SheetTitle>
          <SheetDescription>Update a users role within the workspace.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleUpdate} className="flex flex-1 flex-col gap-4 p-5 overflow-y-auto">
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select
              required
              value={formState.role}
              onValueChange={(value: typeof formState.role) =>
                setFormState((prev) => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue className="capitalize" placeholder={role.toLocaleLowerCase()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="COMMENTER">Commenter</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SheetFooter className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              className="inline-flex items-center gap-1"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" /> Remove User
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
