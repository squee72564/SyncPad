"use server";

import { cookies } from "next/headers";
import Prisma from "@generated/prisma-postgres/index.js";
import { authorizedFetch } from "./api-client";

export type RagHistoryMessage = {
  role: Prisma.RagChatRole;
  content: string;
};

export type RagQueryPayload = {
  query: string;
};

export type RagQueryResult =
  | { success: true; response: string }
  | { success: false; error: string; type: "InputGuardrail" | "Agent" };

export const runRagQuery = async (
  workspaceId: string,
  threadId: string,
  payload: RagQueryPayload
): Promise<RagQueryResult> => {
  const response = await authorizedFetch(`/v1/workspaces/${workspaceId}/chat/${threadId}`, {
    body: JSON.stringify({ query: payload.query }),
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
