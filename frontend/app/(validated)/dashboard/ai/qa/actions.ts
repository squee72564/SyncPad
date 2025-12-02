"use server";

import { runRagQuery, RagQueryPayload } from "@/lib/rag";
import { formatError } from "@/lib/utils";
import { ActionResult } from "@/lib/types";

export type AskQuestionResponse = {
  response: string;
};

export const askWorkspaceQuestionAction = async (
  workspaceId: string,
  threadId: string,
  payload: RagQueryPayload
): Promise<ActionResult<AskQuestionResponse>> => {
  try {
    const result = await runRagQuery(workspaceId, threadId, payload);

    if (result.success) {
      return {
        success: true,
        data: {
          response: result.response,
        },
      };
    }

    return {
      success: false,
      error: result.error ?? "Unable to process your request",
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error, "Unable to process your request"),
    };
  }
};
