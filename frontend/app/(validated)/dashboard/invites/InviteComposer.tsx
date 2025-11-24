"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createWorkspaceInviteAction } from "./actions";

import Prisma from "@generated/prisma-postgres";

const ROLE_OPTIONS: {
  value: Exclude<Prisma.WorkspaceRole, "OWNER">;
  label: string;
  description: string;
}[] = [
  {
    value: "ADMIN",
    label: "Admin",
    description: "Manage members, invites, and workspace settings.",
  },
  {
    value: "EDITOR",
    label: "Editor",
    description: "Create and update documents, but cannot manage workspace settings.",
  },
  {
    value: "COMMENTER",
    label: "Commenter",
    description: "Add comments and view documents without editing content.",
  },
  { value: "VIEWER", label: "Viewer", description: "Read-only access to workspace documents." },
];

type InviteComposerProps = {
  workspaceId: string;
};

export default function InviteComposer({ workspaceId }: InviteComposerProps) {
  const [formState, setFormState] = useState({
    email: "",
    role: ROLE_OPTIONS[1]?.value ?? "EDITOR",
  });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.email || !formState.role) {
      toast.error("Email and role are required");
      return;
    }

    startTransition(() => {
      (async () => {
        const result = await createWorkspaceInviteAction({
          workspaceId,
          email: formState.email,
          role: formState.role,
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("Invite sent");

        if (result.data?.acceptUrl) {
          toast.info("Invite link available", {
            description: "Copy it from the pending invites list below.",
          });
        }

        setFormState((prev) => ({
          ...prev,
          email: "",
        }));
      })();
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Invite teammates</CardTitle>
          <CardDescription>
            Send workspace access to collaborators. Invitations expire after 48 hours and require
            recipients to sign in or create an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Invitee email</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              placeholder="teammate@example.com"
              value={formState.email}
              disabled={isPending}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="invite-role">Workspace role</Label>
            <Select
              value={formState.role}
              onValueChange={(value: Exclude<Prisma.WorkspaceRole, "OWNER">) =>
                setFormState((prev) => ({
                  ...prev,
                  role: value,
                }))
              }
              disabled={isPending}
              required
            >
              <SelectTrigger
                id="invite-role"
                className="w-full [&_[data-slot=select-value]_.role-description]:hidden"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="w-full">
                    <div className="flex flex-col w-full">
                      <span className="font-medium">{option.label}</span>
                      <span className="role-description text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending || formState.email.trim().length === 0}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send invite
            </Button>
            <p className="text-xs text-muted-foreground">
              Need to send multiple? Reuse this form—it will refresh the pending list automatically.
            </p>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
