"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createShareLinkAction } from "./actions";
import { ShareLinkPermission } from "@/lib/share-links";

type ShareLinkCreatorProps = {
  workspaceId: string;
  documentId: string;
};

export default function ShareLinkCreator({ workspaceId, documentId }: ShareLinkCreatorProps) {
  const [formState, setFormState] = useState<{ permission: ShareLinkPermission; expiresAt: string }>({
    permission: "VIEW",
    expiresAt: "",
  });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const expiresAt = formState.expiresAt ? new Date(formState.expiresAt).toISOString() : null;

      const result = await createShareLinkAction({
        workspaceId,
        documentId,
        permission: formState.permission,
        expiresAt,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Share link created");
      setFormState((prev) => ({ ...prev, expiresAt: "" }));
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 shadow-sm space-y-4">
      <div className="space-y-1">
        <Label>Permission</Label>
        <Select
        value={formState.permission}
        onValueChange={(value: ShareLinkPermission) =>
            setFormState((prev) => ({ ...prev, permission: value }))
          }
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VIEW">View only</SelectItem>
            <SelectItem value="COMMENT">Comment</SelectItem>
            <SelectItem value="EDIT">Edit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="share-link-expires">Expires (optional)</Label>
        <Input
          id="share-link-expires"
          type="datetime-local"
          value={formState.expiresAt}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, expiresAt: event.target.value }))
          }
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">Leave blank for no expiration.</p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create share link"}
      </Button>
    </form>
  );
}
