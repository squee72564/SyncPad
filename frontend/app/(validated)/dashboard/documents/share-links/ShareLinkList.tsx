"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Clipboard, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ShareLinkRecord } from "@/lib/share-links";
import { deleteShareLinkAction, updateShareLinkAction } from "./actions";

type ShareLinkListProps = {
  workspaceId: string;
  documentId: string;
  shareLinks: ShareLinkRecord[];
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleString();
};

export default function ShareLinkList({ workspaceId, documentId, shareLinks }: ShareLinkListProps) {
  const [isPending, startTransition] = useTransition();

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch (error) {
      toast.error("Unable to copy link");
      console.error(error);
    }
  };

  const handleRegenerate = (shareLinkId: string) => {
    startTransition(async () => {
      const result = await updateShareLinkAction({
        workspaceId,
        documentId,
        shareLinkId,
        regenerateToken: true,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Share link regenerated");
    });
  };

  const handleDelete = (shareLinkId: string) => {
    const confirmed = window.confirm("Revoke this share link? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteShareLinkAction({ workspaceId, documentId, shareLinkId });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Share link revoked");
    });
  };

  if (shareLinks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        No share links yet. Create one to generate a public token for this document.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted/40 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Link</span>
        <span>Permission</span>
        <span>Expires</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y">
        {shareLinks.map((link) => (
          <div
            key={link.id}
            className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm"
          >
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs truncate">{link.url}</span>
              <span className="text-xs text-muted-foreground">
                Created {new Date(link.createdAt).toLocaleString()}
              </span>
              {link.createdBy ? (
                <span className="text-xs text-muted-foreground">
                  by {link.createdBy.name ?? link.createdBy.email ?? "Unknown"}
                </span>
              ) : null}
            </div>
            <span className="font-medium">{link.permission}</span>
            <span className="text-sm text-muted-foreground">{formatDate(link.expiresAt)}</span>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleCopy(link.url)}
                disabled={isPending}
                title="Copy link"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRegenerate(link.id)}
                disabled={isPending}
                title="Regenerate token"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDelete(link.id)}
                disabled={isPending}
                title="Delete link"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
