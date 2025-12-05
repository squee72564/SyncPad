import { ModelSettings, tool } from "@openai/agents";
import { z } from "zod";

import prisma from "@syncpad/prisma-client";
import Prisma, { Prisma as PrismaNamespace } from "@generated/prisma-postgres/index.js";

const getWorkspaceByIdTool = tool({
  name: "getWorkspaceById",
  description: "Fetch a workspace by ID.",
  parameters: z.object({
    workspaceId: z.string(),
  }),
  async execute({ workspaceId }: { workspaceId: string }) {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        name: true,
        id: true,
        createdAt: true,
        description: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!workspace) {
      return null;
    }

    return {
      ...workspace,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  },
});

export const WorkspaceContextRetrievalSchema = z.object({
  reasoning: z.string(),
  workspace: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
      createdBy: z.object({
        id: z.string(),
        name: z.string(),
        email: z.email(),
      }),
    })
    .nullable(),
  confidence: z.number().min(0).max(1),
});

export const WorkspaceContextRetrievalAgentOptions = {
  instructions: `
You are the Context Retrieval Agent.

Your task is to gather all relevant structured data needed to satisfy the user's request based on:

1. The Intent Classifier output (taskType + requiredContext)

You MAY call any tools provided to fetch additional data for workspaces.

Rules:
- Only call tools when their data is required.
- Do NOT summarize data—the final agent will do that.
- Do NOT perform reasoning about document content.
- Do NOT guess missing data; use tools to retrieve it.
- Do NOT output any data not explicitly found in the tool calls
- It is okay to output nothing if there is no relevant data found
- Keep reasoning short.
- Return only the JSON that matches the schema.

### Example:

###

Return the gathered context in the output JSON.
`,
  name: "Context Retrieval Agent",
  model: "gpt-4.1",
  outputType: WorkspaceContextRetrievalSchema,
  modelSettings: {
    toolChoice: "auto",
    store: false,
    temperature: 0.2,
  } as ModelSettings,
  tools: [getWorkspaceByIdTool],
};
