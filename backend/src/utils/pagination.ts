type CursorInput<TCursor> = {
  cursor?: TCursor | null | undefined;
  limit?: number | null | undefined;
  maxLimit?: number | null | undefined;
};

type PaginationParams<TCursor> = {
  cursor?: { id: TCursor };
  skip?: number;
  take: number;
  limit: number;
};

type PaginatedResult<TItem> = {
  items: TItem[];
  nextCursor: string | number | null;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const buildPaginationParams = <TCursor extends string | number>(
  input: CursorInput<TCursor>
): PaginationParams<TCursor> => {
  const maxLimit = input.maxLimit ?? MAX_LIMIT;
  const requested = input.limit ?? DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, requested), maxLimit);

  if (input.cursor !== null && input.cursor !== undefined) {
    return {
      cursor: { id: input.cursor },
      skip: 1,
      take: limit + 1,
      limit,
    };
  }

  return {
    take: limit + 1,
    limit,
  };
};

export const paginateItems = <TItem extends { id: string | number }>(
  items: TItem[],
  limit: number
): PaginatedResult<TItem> => {
  const hasNext = items.length > limit;
  const trimmed = hasNext ? items.slice(0, limit) : items;
  const last = trimmed[trimmed.length - 1];

  return {
    items: trimmed,
    nextCursor: hasNext && last ? last.id : null,
  };
};

export const paginationConstants = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
