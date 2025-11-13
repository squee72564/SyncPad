import { resolveActiveWorkspace } from "@/lib/workspaces";
import { listDocuments } from "@/lib/documents";
import WorkspaceSelectionPrompt from "@/components/WorkspaceSelectionPrompt";
import DocumentSelector from "./DocumentSelector";
import ShareLinkCreator from "./ShareLinkCreator";
import ShareLinkList from "./ShareLinkList";
import { listShareLinks } from "@/lib/share-links";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const pageTextData = {
  title: "Share Links",
  description: "Manage Share Links for Your Documents.",
};

type ShareLinksPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const getDocumentIdFromParams = (
  searchParams: ShareLinksPageProps["searchParams"] | undefined
) => {
  if (!searchParams) {
    return undefined;
  }

  const raw = searchParams.documentId;

  if (!raw) {
    return undefined;
  }

  if (Array.isArray(raw)) {
    return raw[0];
  }

  return raw;
};

export default async function ShareLinksPage({ searchParams }: ShareLinksPageProps) {
  const { activeWorkspace } = await resolveActiveWorkspace();

  if (!activeWorkspace) {
    return (
      <WorkspaceSelectionPrompt
        title={pageTextData.title}
        description={pageTextData.description}
        body="Share links are scoped to a workspace. Pick one from the sidebar or create a new workspace to begin."
      />
    );
  }

  const documents = await listDocuments(
    activeWorkspace.workspace.id,
    activeWorkspace.workspace.slug,
    { includeContent: false }
  );

  if (documents.length === 0) {
    return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <PageHeader
        header={pageTextData.title}
        body={pageTextData.description}
      />
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
    </div>
    );
  }

  const requestedDocumentId = getDocumentIdFromParams(searchParams);
  const selectedDocument =
    documents.find((doc) => doc.id === requestedDocumentId) ?? documents[0];

  const shareLinks = await listShareLinks(
    activeWorkspace.workspace.id,
    selectedDocument.id
  );

  return (
    <div className="flex flex-col gap-4 p-6 w-full">
      <PageHeader
        header={pageTextData.title}
        body={pageTextData.description}
      />
      <DocumentSelector
        documents={documents.map((doc) => ({ id: doc.id, title: doc.title }))}
        selectedDocumentId={selectedDocument.id}
      />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">{selectedDocument.title}</h2>
        <p className="text-sm text-muted-foreground">
          Manage public access for this document. Only users with share permissions can modify
          these tokens.
        </p>
      </div>

      <ShareLinkCreator
        workspaceId={activeWorkspace.workspace.id}
        documentId={selectedDocument.id}
      />

      <ShareLinkList
        workspaceId={activeWorkspace.workspace.id}
        documentId={selectedDocument.id}
        shareLinks={shareLinks}
      />
    </div>
  );
}
