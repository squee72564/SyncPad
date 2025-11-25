"use client";

import { toast } from "sonner";

import type { AiListJobRecord } from "@/lib/ai-jobs";
import { loadAiJobsAction } from "./actions";
import Timeline from "@/components/Timeline";
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import Prisma, { $Enums } from "@generated/prisma-postgres";

const formatJobType = (aiJobType: $Enums.AiJobType) => {
  switch (aiJobType) {
    case $Enums.AiJobType.ALERT:
      return "Alert";
    case $Enums.AiJobType.EMBEDDING:
      return "Document Embedding Job";
    case $Enums.AiJobType.QA:
      return "AI Workspace Q/A";
    case $Enums.AiJobType.SUMMARY:
      return "AI Workspace Summany";
  }
};

const formatTimestamp = (value: string | Date | null | undefined) => {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    value = new Date(value);
  }
  return value.toLocaleString();
};

const getActorDisplay = (user: Pick<Prisma.User, "name" | "email"> | null) => {
  if (user?.name) {
    return user.name;
  }

  if (user?.email) {
    return user.email;
  }

  return "System";
};

const getDocumentLabel = (document: Partial<Prisma.Document> | null) => {
  if (document?.title) {
    return document.title;
  }

  if (document?.slug) {
    return `Document ${document.slug}`;
  }

  return null;
};

type AiJobTimelineProps = {
  workspaceId: string;
  aiJobs: AiListJobRecord[];
  nextCursor: string | null;
};

export default function AiJobTimeline({ workspaceId, aiJobs, nextCursor }: AiJobTimelineProps) {
  const handleDelete = async (aiJob: AiListJobRecord) => {
    // const result = await deleteAiJobAction(workspaceId, log.id);
    // if (!result.success) {
    //   throw new Error(result.error || "Failed to delete Ai Job");
    // }
  };

  const handleLoadMore = async (cursor: string | null) => {
    const result = await loadAiJobsAction(workspaceId, {
      cursor: cursor ?? undefined,
      limit: 5,
    });

    if (!result.success) {
      toast.error(result.error ?? "Unable to load more Ai Jobs");
      return { data: [], nextCursor: null };
    }

    if (!result.data) {
      toast.error("Unable to load more Ai Jobs");
      return { data: [], nextCursor: null };
    }

    return result.data;
  };

  const renderAiJobItem = (aiJob: AiListJobRecord, onDelete?: () => void) => {
    const jobTypeFormated = formatJobType(aiJob.type);
    return (
      <>
        <CardHeader>
          <CardTitle>{jobTypeFormated}</CardTitle>
          <CardDescription>Submitted by: {getActorDisplay(aiJob.requestedBy)}</CardDescription>
          {onDelete && (
            <CardAction>
              <Button variant="ghost" size="icon" onClick={onDelete} title="Delete activity log">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p>Queued at: {formatTimestamp(aiJob.queuedAt)}</p>
          <p>Started at: {formatTimestamp(aiJob.startedAt)}</p>
          <p>Completed at: {formatTimestamp(aiJob.completedAt)}</p>
        </CardContent>
        <CardFooter>
          {aiJob.type === $Enums.AiJobType.EMBEDDING && aiJob.document ? (
            <Link href={`/dashboard/documents/${aiJob.documentId}`}>
              <Badge variant={"secondary"}>Document: {getDocumentLabel(aiJob.document)}</Badge>
            </Link>
          ) : null}
        </CardFooter>
      </>
    );
  };

  return (
    <Timeline<AiListJobRecord>
      data={aiJobs}
      nextCursor={nextCursor}
      onLoadMore={handleLoadMore}
      onDeleteItem={handleDelete}
      renderItem={renderAiJobItem}
      emptyMessage="No AI Jobs yet. Once you publish/archive a document, or use the workspace Q&A, entries will appear here"
    />
  );
}
