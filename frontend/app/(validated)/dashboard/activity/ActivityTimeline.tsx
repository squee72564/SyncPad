"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ActivityLogRecord } from "@/lib/activity-log";
import { deleteActivityLogAction, loadActivityLogsAction } from "./actions";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import Link from "next/link";

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

const getActorDisplay = (log: ActivityLogRecord) => {
  if (log.actor?.name) {
    return log.actor.name;
  }

  if (log.actor?.email) {
    return log.actor.email;
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
  const [isPending, startTransition] = useTransition();

  const {
    items,
    nextCursor: cursor,
    isLoading,
    loadMore,
    setItems,
  } = useCursorPagination<ActivityLogRecord>({
    initialData: activityLogs,
    initialCursor: nextCursor,
    loadMore: async (cursorValue) => {
      const result = await loadActivityLogsAction(workspaceId, {
        cursor: cursorValue ?? undefined,
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
    },
  });

  const handleDelete = (activityLogId: string) => {
    const confirmed = window.confirm("Remove this activity entry? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteActivityLogAction(workspaceId, activityLogId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setItems((prev) => prev.filter((log) => log.id !== activityLogId));

      toast.success("Activity log removed");
    });
  };

  const handleLoadMore = () => {
    if (!cursor || isLoading) return;
    loadMore();
  };

  return (
    <>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          No activity yet. Once you publish documents, invite teammates, or trigger AI jobs, entries
          will appear here.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" aria-hidden />
          <ul className="space-y-4 pl-8">
            {items.map((log) => {
              const documentLabel = getDocumentLabel(log);
              const metadataEntries = Object.entries(log.metadata ?? {});
              const logEventFormatted = log.event
                .split(".")
                .map((word) => word.at(0)?.toUpperCase() + word.slice(1))
                .join(" ");

              return (
                <li key={log.id} className="relative">
                  <div className="absolute -left-0.5 top-3 size-3 -translate-x-1/2 rounded-full border-2 border-background bg-primary" />
                  <Card>
                    <CardHeader>
                      <CardTitle>{logEventFormatted}</CardTitle>
                      <CardDescription>
                        {formatTimestamp(log.createdAt)} • {getActorDisplay(log)}
                      </CardDescription>
                      <CardAction>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(log.id)}
                          disabled={isPending}
                          title="Delete activity log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardAction>
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
                      <CardFooter>
                        <Link href={`documents/${log.documentId}`}>
                          <Badge variant={"secondary"} className="hover:border-primary">
                            Document: {documentLabel}
                          </Badge>
                        </Link>
                      </CardFooter>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {cursor ? (
        <div className="mt-4 flex justify-center">
          <Button onClick={handleLoadMore} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
