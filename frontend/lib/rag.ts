"use server";

import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export type RagHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RagQueryPayload = {
  query: string;
  history?: RagHistoryMessage[];
};

export type RagQueryResult =
  | { success: true; response: string }
  | { success: false; error: string; type: "InputGuardrail" | "Agent" };

const buildCookieHeader = async () => {
  const cookieStore = await cookies();
  const cookiePairs = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  return cookiePairs.length > 0 ? cookiePairs : undefined;
};

export const runRagQuery = async (
  workspaceId: string,
  payload: RagQueryPayload
): Promise<RagQueryResult> => {
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(`${API_BASE_URL}/v1/workspaces/${workspaceId}/rag/query`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  try {
    const data = (await response.json()) as
      | { success: true; response: string }
      | { success: false; type: "InputGuardrail" | "Agent"; error: string };

    if (data.success) {
      return { success: true, response: data.response };
    }

    return {
      success: false,
      type: data.type,
      error: data.type === "InputGuardrail" ? "Request blocked by safety filters." : data.error,
    };
  } catch {
    return {
      success: false,
      type: "Agent",
      error: "Request failed",
    };
  }
};
