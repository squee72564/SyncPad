import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetDescription,
} from "@/components/ui/sheet";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentRecord } from "@/lib/documents";
import { DocumentMetadataForm } from "./DocumentMetadataForm";

export default function DocumentSheet({
  SelectedDocument,
  workspaceDocuments,
}: {
  SelectedDocument: DocumentRecord;
  workspaceDocuments: DocumentRecord[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={"outline"}>Open</Button>
      </SheetTrigger>
      <SheetContent className="p-5">
        <SheetHeader>
          <SheetTitle>Document details</SheetTitle>
          <SheetDescription>
            Manage metadata and status. Collaborative editing will arrive in a future update.
          </SheetDescription>
        </SheetHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DocumentStatusBadge status={SelectedDocument.status} />
          <span>Updated {new Date(SelectedDocument.updatedAt).toLocaleString()}</span>
        </div>
        <DocumentMetadataForm document={SelectedDocument} allDocuments={workspaceDocuments} />
      </SheetContent>
    </Sheet>
  );
}
