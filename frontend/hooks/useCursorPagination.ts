"use client";

import { useCallback, useState, useTransition } from "react";
import { PaginatedResult } from "@/lib/types";

export function useCursorPagination<T>({
  initialData,
  initialCursor,
  loadMore,
}: {
  initialData: T[];
  initialCursor: string | null;
  loadMore: (cursor: string | null) => Promise<PaginatedResult<T>>;
}) {
  const [items, setItems] = useState<T[]>(initialData);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = useCallback(() => {
    if (!nextCursor || isPending) return;

    startTransition(async () => {
      const result = await loadMore(nextCursor);
      setItems((prev) => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
    });
  }, [loadMore, nextCursor, isPending]);

  return {
    items,
    nextCursor,
    isLoading: isPending,
    loadMore: handleLoadMore,
    setItems,
  };
}
