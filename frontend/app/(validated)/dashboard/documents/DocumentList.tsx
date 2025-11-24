import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { DocumentRecord } from "@/lib/documents";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import DocumentSheet from "./DocumentSheet";

type DocumentListProps = {
  documents: DocumentRecord[];
};

export default function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 p-10 text-center w-full">
        <h3 className="text-base font-semibold">No documents yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first document to capture knowledge, collaborate with teammates, and unlock AI
          insights for your workspace.
        </p>
        <Button asChild size="sm" className="mt-2">
          <Link href="/dashboard/documents/new">
            Create document
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const documentsById = new Map(documents.map((doc) => [doc.id, doc]));

  return (
    <div className="overflow-hidden rounded-lg border w-full">
      <div className="bg-muted/40 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Title</span>
        <span>Status</span>
        <span>Last Edited</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y">
        {documents.map((document) => {
          const parent = document.parentId ? documentsById.get(document.parentId) : null;
          return (
            <div
              key={document.id}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-1">
                <Link
                  href={`/dashboard/documents/${document.id}`}
                  className="text-foreground font-medium hover:underline"
                >
                  {document.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  Updated {formatDate(document.updatedAt)}
                </span>
                {parent ? (
                  <span className="text-xs text-muted-foreground">
                    Child of <span className="font-medium">{parent.title}</span>
                  </span>
                ) : null}
              </div>
              <div>
                <DocumentStatusBadge status={document.status} />
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(document.lastEditedAt)}
              </span>
              <div className="flex justify-end">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  )}
                >
                  <DocumentSheet SelectedDocument={document} workspaceDocuments={documents} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
