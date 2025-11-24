export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
};

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type PickWithOptional<T, Picked extends keyof T, Optional extends Picked> = Omit<
  Pick<T, Picked>,
  Optional
> &
  Partial<Pick<T, Optional>>;
