"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DocumentSelectorProps = {
  documents: { id: string; title: string }[];
  selectedDocumentId: string;
};

export default function DocumentSelector({ documents, selectedDocumentId }: DocumentSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (documentId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("documentId", documentId);
      router.replace(`/dashboard/documents/share-links?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">Document</span>
      <Select value={selectedDocumentId} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger>
          <SelectValue placeholder="Select document" />
        </SelectTrigger>
        <SelectContent>
          {documents.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              {doc.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
