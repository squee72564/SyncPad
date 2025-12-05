import { ModelSettings, tool } from "@openai/agents";
import { z } from "zod";

import prisma from "@syncpad/prisma-client";
import Prisma, { Prisma as PrismaNamespace } from "@generated/prisma-postgres/index.js";

const listActivityLogsByWorkspaceIdTool = tool({
  name: "listActivityLogsByWorkspaceId",
  description: "Fetch all activity logs for a workspace by workspace ID.",
  parameters: z.object({
    workspaceId: z.string(),
  }),
  async execute({ workspaceId }: { workspaceId: string }) {
    const logs = await prisma.activityLog.findMany({
      where: { workspaceId },
    });

    return logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      metadata: log.metadata ? JSON.stringify(log.metadata) : null,
    }));
  },
});

const getActivityLogsByWorkspaceIdAndLogId = tool({
  name: "getActivityLogsByWorkspaceIdAndLogId",
  description:
    "Fetch a specific activity log within a worspace with the workspace ID and activity log ID",
  parameters: z.object({
    workspaceId: z.string(),
    activityLogId: z.string(),
  }),
  async execute({ workspaceId, activityLogId }: { workspaceId: string; activityLogId: string }) {
    const log = await prisma.activityLog.findUnique({
      where: { workspaceId, id: activityLogId },
    });

    if (!log) return null;

    return {
      ...log,
      createdAt: log.createdAt.toISOString(),
      metadata: log.metadata ? JSON.stringify(log.metadata) : null,
    };
  },
});

export const ActivityLogContextRetrievalSchema = z.object({
  reasoning: z.string(),
  activityLogs: z
    .array(
      z.object({
        workspaceId: z.string(),
        id: z.string(),
        createdAt: z.iso.datetime(),
        actorId: z.string().nullable(),
        documentId: z.string().nullable(),
        event: z.string(),
        metadata: z.string().nullable(),
      })
    )
    .nullable(),
  confidence: z.number().min(0).max(1),
});

export const ActivityLogContextRetrievalAgentOptions = {
  instructions: `
You are the Activity Log Context Retrieval Agent.

Your task is to gather all relevant activity log data needed to satisfy the users request base on:

1. The Intent Classifier Agent's output

You MAY call any tools provided to fetch data associated with activity logs.

Rules:
- Only call tools when their data is required.
- Do NOT summarize data—the final agent will do that.
- Do NOT perform reasoning about document content.
- Do NOT guess missing data; use tools to retrieve it.
- Do NOT output any data not explicitly found in the tool calls
- It is okay to ouptut null if there is no relevant data found
- Keep reasoning short.
- Return only the JSON that matches the schema.

### Example:

###

Return the gathered context in the output JSON.
`,
  name: "Activity Log Context Retrieval Agent",
  model: "gpt-4.1",
  outputType: ActivityLogContextRetrievalSchema,
  modelSettings: {
    toolChoice: "auto",
    store: false,
    temperature: 0.3,
  } as ModelSettings,
  tools: [listActivityLogsByWorkspaceIdTool, getActivityLogsByWorkspaceIdAndLogId],
};
