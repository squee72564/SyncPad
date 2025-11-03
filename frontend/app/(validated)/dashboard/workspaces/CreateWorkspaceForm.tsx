"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createWorkspaceAction } from "./actions";

type FormState = {
  name: string;
  slug: string;
  description: string;
};

const MAX_SLUG_LENGTH = 63;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);

export default function CreateWorkspaceForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    name: "",
    slug: "",
    description: "",
  });

  const [slugEdited, setSlugEdited] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!slugEdited) {
      setFormState((prev) => ({
        ...prev,
        slug: slugify(prev.name),
      }));
    }
  }, [formState.name, slugEdited]);

  const slugIsValid = useMemo(
    () => /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/.test(formState.slug),
    [formState.slug]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await createWorkspaceAction({
        name: formState.name,
        slug: formState.slug,
        description: formState.description || "",
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Workspace created successfully");
      router.replace("/dashboard");
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create Workspace</CardTitle>
          <CardDescription>
            Define the essentials for your new workspace. You can manage members, invites, and
            permissions after it’s created.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              autoFocus
              autoComplete="off"
              placeholder="Acme Design Studio"
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
            <Label htmlFor="workspace-slug">Workspace slug</Label>
            <Input
              id="workspace-slug"
              autoComplete="off"
              placeholder="acme-design"
              value={formState.slug}
              disabled={isPending}
              onChange={(event) => {
                setSlugEdited(true);
                setFormState((prev) => ({
                  ...prev,
                  slug: event.target.value.toLowerCase(),
                }));
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              This slug is used in workspace URLs. Lowercase letters, numbers, and dashes only.
            </p>
            {!slugIsValid && formState.slug.length > 0 ? (
              <p className="text-xs text-destructive">
                Slug must be alphanumeric, may include dashes, and cannot start or end with one.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="workspace-description">Description (optional)</Label>
            <Textarea
              id="workspace-description"
              autoComplete="off"
              placeholder="Share a short description so teammates know what lives here."
              value={formState.description}
              disabled={isPending}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              maxLength={512}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={
                isPending ||
                formState.name.trim().length === 0 ||
                formState.slug.trim().length === 0 ||
                !slugIsValid
              }
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create workspace
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => {
                router.back();
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
