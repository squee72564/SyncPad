"use client";

import { toast } from "sonner";

import type { ActivityLogRecord } from "@/lib/activity-log";
import { deleteActivityLogAction, loadActivityLogsAction } from "./actions";
import Timeline from "@/components/Timeline";
import {
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import Prisma from "@generated/prisma-postgres";

type ActivityTimelineProps = {
  workspaceId: string;
  activityLogs: ActivityLogRecord[];
  nextCursor: string | null;
};

const formatTimestamp = (value: string | Date) => {
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

const getDocumentLabel = (log: ActivityLogRecord) => {
  if (log.document?.title) {
    return log.document.title;
  }

  if (log.document?.slug) {
    return `Document ${log.document.slug}`;
  }

  return null;
};

const formatMetadataValue = (value: unknown) => {
  if (value === null || typeof value === "undefined") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "Unsupported data";
  }
};

export default function ActivityTimeline({
  workspaceId,
  activityLogs,
  nextCursor,
}: ActivityTimelineProps) {
  const handleDelete = async (log: ActivityLogRecord) => {
    const result = await deleteActivityLogAction(workspaceId, log.id);

    if (!result.success) {
      throw new Error(result.error || "Failed to delete activity log");
    }
  };

  const handleLoadMore = async (cursor: string | null) => {
    const result = await loadActivityLogsAction(workspaceId, {
      cursor: cursor ?? undefined,
      limit: 5,
    });

    if (!result.success) {
      toast.error(result.error ?? "Unable to load more activity");
      return { data: [], nextCursor: null };
    }

    if (!result.data) {
      toast.error("Unable to load more activity");
      return { data: [], nextCursor: null };
    }

    return result.data;
  };

  const renderActivityLogItem = (log: ActivityLogRecord, onDelete?: () => void) => {
    const documentLabel = getDocumentLabel(log);
    const metadataEntries = Object.entries(log.metadata ?? {});
    const logEventFormatted = log.event
      .split(".")
      .map((word) => word.at(0)?.toUpperCase() + word.slice(1))
      .join(" ");

    return (
      <>
        <CardHeader>
          <CardTitle>{logEventFormatted}</CardTitle>
          <CardDescription>
            {formatTimestamp(log.createdAt)} • {getActorDisplay(log.actor)}
          </CardDescription>
          {onDelete && (
            <CardAction>
              <Button variant="ghost" size="icon" onClick={onDelete} title="Delete activity log">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {metadataEntries.length > 0 ? (
            <>
              {metadataEntries.map(([key, value]) => (
                <Badge key={key} variant={"outline"} className="truncate">
                  {key}: {formatMetadataValue(value)}
                </Badge>
              ))}
            </>
          ) : null}
        </CardContent>

        {documentLabel ? (
          <div className="px-6 py-3 border-t">
            <Link href={`documents/${log.documentId}`}>
              <Badge variant={"secondary"} className="hover:border-primary">
                Document: {documentLabel}
              </Badge>
            </Link>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <Timeline<ActivityLogRecord>
      data={activityLogs}
      nextCursor={nextCursor}
      onLoadMore={handleLoadMore}
      onDeleteItem={handleDelete}
      renderItem={renderActivityLogItem}
      emptyMessage="No activity yet. Once you publish documents, invite teammates, or trigger AI jobs, entries will appear here."
    />
  );
}
