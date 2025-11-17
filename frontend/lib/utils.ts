import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSafeRedirect(target?: string | null, fallback = "/dashboard") {
  if (!target) {
    return fallback;
  }

  if (typeof target !== "string") {
    return fallback;
  }

  if (!target.startsWith("/")) {
    return fallback;
  }

  if (target.startsWith("//")) {
    return fallback;
  }

  return target;
}

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export const formatError = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
