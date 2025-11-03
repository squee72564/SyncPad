"use server";

import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

async function buildCookieHeader(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookiePairs = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  return cookiePairs.length > 0 ? cookiePairs : undefined;
}

export async function authorizedFetch(path: string, init: RequestInit = {}) {
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers(init.headers);

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = response.statusText || "Request failed";

    try {
      const data = await response.json();
      message = (data?.message as string) ?? (data?.error as string) ?? message;
    } catch {
      const fallback = await response.text();
      if (fallback) {
        message = fallback;
      }
    }

    throw new Error(message);
  }

  return response;
}
