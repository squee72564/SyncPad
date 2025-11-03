"use client";

import { cn } from "@/lib/utils";

type DocumentStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  PUBLISHED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
  ARCHIVED: "bg-slate-200 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
