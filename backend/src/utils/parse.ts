// Align slug format for uniqueness checks.
export const normalizeSlug = (slug?: string) => slug?.trim().toLowerCase();

export const normalizeEmail = (email?: string) => email?.trim().toLowerCase();

// Support query params that arrive as either boolean or stringified boolean.
export const parseBoolean = (value: boolean | "true" | "false" | undefined) => {
  if (value === undefined) {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return value === "true";
};
