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

    // Convert createdAt → ISO string
    return members.map((m) => ({
      createdAt: m.createdAt.toISOString(),
      role: m.role,
      user: m.user,
    }));
  },
});

const getDocumentByWorkspaceAndDocIdTool = tool({
  name: "getDocumentByWorkspaceAndDocId",
  description: "Fetch a specific document by workspace ID and document ID.",
  parameters: z.object({
    workspaceId: z.string(),
    documentId: z.string(),
  }),
  async execute({ workspaceId, documentId }: { workspaceId: string; documentId: string }) {
    const doc = await prisma.document.findUnique({
      where: { workspaceId, id: documentId },
      select: {
        title: true,
        summary: true,
        slug: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!doc) return null;

    return {
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  },
});

export const ContextRetrievalSchema = z.object({
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
  // documents: z.array(
  //     z.object({

  //     })
  //   ).nullable(),
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
  workspaceMembers: z
    .array(
      z.object({
        createdAt: z.iso.datetime(),
        role: z.enum(["OWNER", "ADMIN", "EDITOR", "COMMENTER", "VIEWER"]),
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

export const ContextRetrievalAgentOptions = {
  instructions: `
You are the Context Retrieval Agent.

Your task is to gather all relevant structured data needed to satisfy the user's request based on:

1. The Intent Classifier output (taskType + requiredContext)

You MAY call any tools provided to fetch additional data (workspace, members, activity logs). 
You DO NOT have access to document data, so ignore any request that would require retrieval of document data.

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

If the intent specifies:
requiredContext: ["workspace", "documents"]

Then:
- Call getWorkspaceById
! You cannot get document data, so just use the workspace data

###

Return the gathered context in the output JSON.
`,
  name: "Context Retrieval Agent",
  model: "gpt-4.1",
  outputType: ContextRetrievalSchema,
  modelSettings: {
    toolChoice: "auto",
    store: false,
    temperature: 0.2,
  } as ModelSettings,
  tools: [
    getWorkspaceByIdTool,
    listActivityLogsByWorkspaceIdTool,
    listWorkspaceMembersByWorkspaceIdTool,
  ],
};
