"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WorkspaceInviteRecord } from "@/lib/invites";
import { resendWorkspaceInviteAction, revokeWorkspaceInviteAction } from "./actions";
import { cn } from "@/lib/utils";

type InviteListProps = {
  workspaceId: string;
  invites: WorkspaceInviteRecord[];
  canManage: boolean;
};

type PendingActionType = "resend" | "revoke";

type PendingAction = {
  inviteId: string;
  type: PendingActionType;
} | null;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  COMMENTER: "Commenter",
  VIEWER: "Viewer",
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-sky-100 text-sky-800",
  EDITOR: "bg-emerald-100 text-emerald-700",
  COMMENTER: "bg-amber-100 text-amber-800",
  VIEWER: "bg-slate-100 text-slate-700",
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
};

export default function InviteList({ workspaceId, invites, canManage }: InviteListProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isPending, startTransition] = useTransition();

  const sortedInvites = useMemo(
    () =>
      [...invites].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [invites]
  );

  const handleCopyLink = async (acceptUrl?: string) => {
    if (!acceptUrl) {
      toast.info("Invite link unavailable", {
        description: "Links are only shown in development or when email delivery is disabled.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(acceptUrl);
      toast.success("Invite link copied");
    } catch {
      toast.error("Failed to copy invite link");
    }
  };

  const executeAction = (
    inviteId: string,
    type: PendingActionType,
    action: () => Promise<void>
  ) => {
    startTransition(() => {
      setPendingAction({ inviteId, type });
      action().finally(() => {
        setPendingAction(null);
      });
    });
  };

  const handleResend = (inviteId: string) => {
    executeAction(inviteId, "resend", async () => {
      const result = await resendWorkspaceInviteAction({
        workspaceId,
        inviteId,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Invite resent");

      if (result.data?.acceptUrl) {
        toast.info("New invite link available", {
          description: "Copy it from the pending invites list below.",
        });
      }
    });
  };

  const handleRevoke = (inviteId: string) => {
    const confirmed = window.confirm("Revoke this invite? The recipient will lose access.");
    if (!confirmed) {
      return;
    }

    executeAction(inviteId, "revoke", async () => {
      const result = await revokeWorkspaceInviteAction({
        workspaceId,
        inviteId,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Invite revoked");
    });
  };

  if (sortedInvites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 p-10 text-center">
        <h3 className="text-base font-semibold">No pending invites</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Send invitations to teammates to see them listed here. You can resend links or revoke
          access if someone no longer needs it.
        </p>
      </div>
    );
  }

  const isActionPending = (inviteId: string, type: PendingActionType) =>
    isPending && pendingAction?.inviteId === inviteId && pendingAction?.type === type;

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="bg-muted/40 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Invitee</span>
        <span>Role</span>
        <span>Expires</span>
        {canManage ? <span className="text-right">Actions</span> : null}
      </div>
      <div className="divide-y">
        {sortedInvites.map((invite) => {
          const inviter =
            invite.invitedBy?.name ||
            invite.invitedBy?.email ||
            (invite.invitedById ? "Workspace Admin" : "Automated");

          return (
            <div
              key={invite.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{invite.email}</span>
                <span className="text-xs text-muted-foreground">
                  Invited by {inviter} • Sent {formatDate(invite.createdAt)}
                </span>
              </div>
              <div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                    ROLE_STYLES[invite.role] ?? "bg-muted text-foreground"
                  )}
                >
                  {ROLE_LABELS[invite.role] ?? invite.role}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {invite.expiresAt ? (
                  <>
                    Expires <span className="text-foreground">{formatDate(invite.expiresAt)}</span>
                  </>
                ) : (
                  "No expiration"
                )}
              </div>
              {canManage ? (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Copy invite link"
                    onClick={() => handleCopyLink(invite.acceptUrl)}
                    disabled={!invite.acceptUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Resend invite"
                    onClick={() => handleResend(invite.id)}
                    disabled={isActionPending(invite.id, "resend")}
                  >
                    {isActionPending(invite.id, "resend") ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    title="Revoke invite"
                    onClick={() => handleRevoke(invite.id)}
                    disabled={isActionPending(invite.id, "revoke")}
                  >
                    {isActionPending(invite.id, "revoke") ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
