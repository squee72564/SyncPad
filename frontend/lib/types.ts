export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
};

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };
