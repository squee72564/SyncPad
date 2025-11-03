import Link from "next/link";

import { resolveActiveWorkspace } from "@/lib/workspaces";
import { getDocument, listDocuments } from "@/lib/documents";
import DocumentList from "./DocumentList";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentMetadataForm } from "./DocumentMetadataForm";

type DocumentsPageProps = {
  searchParams?: {
    documentId?: string;
  };
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = await Promise.resolve(searchParams);
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Documents</h1>
          <p className="text-sm text-muted-foreground">
            Select a workspace to browse its documents or create a new one to get started.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          <p className="mb-4">
            You do not have an active workspace. Choose one from the sidebar or create a new
            workspace to begin organizing documents.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/workspaces/new">Create workspace</Link>
          </Button>
        </div>
      </div>
    );
  }
  const documents = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug
  );

  const selectedDocumentId = params?.documentId;
  const selectedDocument = selectedDocumentId
    ? await getDocument(
        activeWorkspace.workspace.id,
        activeWorkspace.workspace.slug,
        selectedDocumentId
      ).catch(() => null)
    : null;
  const invalidSelection = Boolean(selectedDocumentId && !selectedDocument);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">All Documents</h1>
        <p className="text-sm text-muted-foreground">
          Browse every document within{" "}
          <span className="font-medium">{activeWorkspace.workspace.name}</span>, grouped by
          hierarchy and status.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <DocumentList documents={documents} />
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {selectedDocument ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">Document details</h2>
                <p className="text-sm text-muted-foreground">
                  Manage metadata and status. Collaborative editing will arrive in a future update.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DocumentStatusBadge status={selectedDocument.status} />
                <span>Updated {new Date(selectedDocument.updatedAt).toLocaleString()}</span>
              </div>
              <DocumentMetadataForm document={selectedDocument} allDocuments={documents} />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              {invalidSelection ? (
                <>
                  <p>We couldn&apos;t find that document. It may have been deleted.</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/documents">Return to documents</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p>Select a document to manage its metadata.</p>
                  <p>You can also create new documents or change statuses from the list.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
