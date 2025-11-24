"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentRecord } from "@/lib/documents";
import { createDocumentAction } from "./actions";
import { formatError } from "@/lib/utils";

type CreateDocumentFormProps = {
  documents: DocumentRecord[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export function CreateDocumentForm({ documents }: CreateDocumentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [parentId, setParentId] = useState<string>("");

  const parentOptions = useMemo(() => {
    return documents.map((doc) => ({
      value: doc.id,
      label: doc.title,
    }));
  }, [documents]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formTitle = title.trim();

    if (!formTitle) {
      toast.error("Document title is required");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createDocumentAction({
          title: formTitle,
          slug: slug.trim() || undefined,
          headline: headline.trim() || undefined,
          summary: summary.trim() || undefined,
          parentId: parentId ? parentId : null,
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("Document created");
        router.push(`/dashboard/documents`);
        router.refresh();
      } catch (error) {
        const message = formatError(error, "Failed to create document");
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="document-title">Title</Label>
        <Input
          id="document-title"
          value={title}
          onChange={(event) => {
            const value = event.target.value;
            setTitle(value);
            if (!slugDirty) {
              setSlug(slugify(value));
            }
          }}
          placeholder="Team roadmap"
          disabled={isPending}
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="document-slug">Slug (optional)</Label>
        <Input
          id="document-slug"
          value={slug}
          onChange={(event) => {
            setSlugDirty(true);
            setSlug(event.target.value);
          }}
          placeholder="team-roadmap"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and dashes only. Leave blank to auto-generate.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="document-headline">Headline (optional)</Label>
        <Input
          id="document-headline"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="High-level summary"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="document-summary">Summary (optional)</Label>
        <Textarea
          id="document-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Context for readers or collaborators"
          disabled={isPending}
          rows={4}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="document-parent">Parent (optional)</Label>
        <select
          id="document-parent"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
          disabled={isPending || parentOptions.length === 0}
        >
          <option value="">No parent</option>
          {parentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create document"}
        </Button>
      </div>
    </form>
  );
}
