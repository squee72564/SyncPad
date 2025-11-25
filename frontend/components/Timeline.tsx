"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import React from "react";

type TimelineProps<T> = {
  data: T[];
  nextCursor: string | null;
  onLoadMore: (cursor: string | null) => Promise<{ data: T[]; nextCursor: string | null }>;
  onDeleteItem?: (item: T) => Promise<void>;
  renderItem: (item: T, onDelete?: () => void) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
};

export default function Timeline<T extends { id: string }>({
  data,
  nextCursor,
  onLoadMore,
  onDeleteItem,
  renderItem,
  isLoading = false,
  emptyMessage = "No items to display.",
}: TimelineProps<T>) {
  const [isPending, startTransition] = useTransition();

  const {
    items,
    nextCursor: cursor,
    isLoading: listIsLoading,
    loadMore,
    setItems,
  } = useCursorPagination<T>({
    initialData: data,
    initialCursor: nextCursor,
    loadMore: onLoadMore,
  });

  const handleDeleteItem = (item: T) => {
    if (!onDeleteItem) return;

    const confirmed = window.confirm("Remove this item? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        await onDeleteItem(item);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success("Item removed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to remove item");
      }
    });
  };

  const handleLoadMore = () => {
    if (!cursor || listIsLoading) return;
    loadMore();
  };

  return (
    <>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" aria-hidden />
          <ul className="space-y-4 pl-8">
            {items.map((item) => (
              <li key={item.id} className="relative">
                <div className="absolute -left-0.5 top-3 size-3 -translate-x-1/2 rounded-full border-2 border-background bg-primary" />
                <Card>
                  {renderItem(item, onDeleteItem ? () => handleDeleteItem(item) : undefined)}
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
      {cursor ? (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={listIsLoading || isLoading}
            variant="outline"
            size="sm"
          >
            {listIsLoading || isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
