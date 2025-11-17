"use client";

import { FormEvent, useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentRecord } from "@/lib/documents";
import { updateDocumentAction, deleteDocumentAction } from "./actions";
import { formatError } from "@/lib/utils";

const DOCUMENT_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

type DocumentMetadataFormProps = {
  document: DocumentRecord;
  allDocuments: DocumentRecord[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export function DocumentMetadataForm({ document, allDocuments }: DocumentMetadataFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(document.title);
  const [slug, setSlug] = useState(document.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(Boolean(document.slug));
  const [headline, setHeadline] = useState(document.headline ?? "");
  const [summary, setSummary] = useState(document.summary ?? "");
  const [parentId, setParentId] = useState(document.parentId ?? "");
  const [status, setStatus] = useState<string>(document.status);

  useEffect(() => {
    setTitle(document.title);
    setSlug(document.slug ?? "");
    setSlugDirty(Boolean(document.slug));
    setHeadline(document.headline ?? "");
    setSummary(document.summary ?? "");
    setParentId(document.parentId ?? "");
    setStatus(document.status);
  }, [document]);

  const parentOptions = useMemo(() => {
    return allDocuments
      .filter((item) => item.id !== document.id)
      .map((doc) => ({
        value: doc.id,
        label: doc.title,
      }));
  }, [allDocuments, document.id]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTitle = title.trim();
    if (!nextTitle) {
      toast.error("Title cannot be empty");
      return;
    }

    startTransition(async () => {
      const nextSlug = slug.trim();

      try {
        const result = await updateDocumentAction({
          documentId: document.id,
          title: nextTitle,
          slug: nextSlug.length > 0 ? nextSlug : null,
          headline,
          summary,
          parentId: parentId ? parentId : null,
          status: status as DocumentRecord["status"],
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("Document updated");
        router.refresh();
      } catch (error) {
        toast.error(formatError(error, "Failed to update document"));
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteDocumentAction(document.id);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("Document deleted");
        router.push("/dashboard/documents");
        router.refresh();
      } catch (error) {
        toast.error(formatError(error, "Failed to delete document"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto">
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
          disabled={isPending}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="document-slug">Slug</Label>
        <Input
          id="document-slug"
          value={slug}
          onChange={(event) => {
            setSlugDirty(true);
            setSlug(event.target.value);
          }}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to auto-generate from the title.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="document-headline">Headline</Label>
        <Input
          id="document-headline"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="document-summary">Summary</Label>
        <Textarea
          id="document-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="document-parent">Parent</Label>
        <select
          id="document-parent"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={parentId ?? ""}
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

      <div className="grid gap-1.5">
        <Label htmlFor="document-status">Status</Label>
        <select
          id="document-status"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          disabled={isPending}
        >
          {DOCUMENT_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              setTitle(document.title);
              setSlug(document.slug ?? "");
              setSlugDirty(Boolean(document.slug));
              setHeadline(document.headline ?? "");
              setSummary(document.summary ?? "");
              setParentId(document.parentId ?? "");
              setStatus(document.status);
            }}
          >
            Reset
          </Button>
        </div>
        <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
          Delete document
        </Button>
      </div>
    </form>
  );
}
