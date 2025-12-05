import { ModelSettings, tool } from "@openai/agents";
import { z } from "zod";

import prisma from "@syncpad/prisma-client";
import Prisma, { Prisma as PrismaNamespace } from "@generated/prisma-postgres/index.js";

const listWorkspaceMembersByWorkspaceIdTool = tool({
  name: "listWorkspaceMembersByWorkspaceMembers",
  description: "Fetch all workspace members for a workspace by workspace ID.",
  parameters: z.object({
    workspaceId: z.string(),
  }),
  async execute({ workspaceId }: { workspaceId: string }) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        createdAt: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return members.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }));
  },
});

const getWorkspaceMemberByWorkspaceIdAndMemberId = tool({
  name: "getWorkspaceMemberByWorkspaceIdAndMemberId",
  description: "Fetch a single workspace member for a workspace by workspace ID and the member ID.",
  parameters: z.object({
    workspaceId: z.string(),
    memberId: z.string(),
  }),
  async execute({ workspaceId, memberId }: { workspaceId: string; memberId: string }) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId, id: memberId },
      select: {
        createdAt: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!member) return null;

    return {
      ...member,
      createdAt: member.createdAt.toISOString(),
    };
  },
});

export const WorkspaceMemberContextRetrievalSchema = z.object({
  reasoning: z.string(),
  workspaceMembers: z
    .array(
      z.object({
        createdAt: z.iso.datetime(),
        role: z.enum([
          Prisma.WorkspaceRole.ADMIN,
          Prisma.WorkspaceRole.COMMENTER,
          Prisma.WorkspaceRole.EDITOR,
          Prisma.WorkspaceRole.OWNER,
          Prisma.WorkspaceRole.VIEWER,
        ]),
        user: z.object({
          id: z.string(),
          name: z.string(),
          email: z.email(),
        }),
      })
    )
    .nullable(),
  confidence: z.number().min(0).max(1),
});

export const WorkspaceMemberContextRetrievalAgentOptions = {
  instructions: `
You are the Workspace Member Context Retrieval Agent.

Your task is to gather all relevant structured data needed to satisfy the user's request based on:

1. The Intent Classifier output (taskType + requiredContext)

You MAY call any tools provided to fetch additional data for workspace members

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
  name: "Workspace Member Context Retrieval Agent",
  model: "gpt-4.1",
  outputType: WorkspaceMemberContextRetrievalSchema,
  modelSettings: {
    toolChoice: "auto",
    store: false,
    temperature: 0.2,
  } as ModelSettings,
  tools: [listWorkspaceMembersByWorkspaceIdTool, getWorkspaceMemberByWorkspaceIdAndMemberId],
};
