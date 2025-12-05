import { ModelSettings, tool } from "@openai/agents";
import { z } from "zod";

import prisma from "@syncpad/prisma-client";
import Prisma, { Prisma as PrismaNamespace } from "@generated/prisma-postgres/index.js";

const listDocumentsByWorkspaceIdTool = tool({
  name: "listDocumentsByWorkspaceId",
  description: "Fetch all documents for a workspace by workspace ID.",
  parameters: z.object({
    workspaceId: z.string(),
  }),
  async execute({ workspaceId }: { workspaceId: string }) {
    const documents = await prisma.document.findMany({
      where: { workspaceId },
      omit: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });

    return documents.map((document) => ({
      ...document,
      publishedAt: document.publishedAt?.toISOString() ?? null,
      createdAt: document.createdAt.toISOString(),
      lastEditedAt: document.lastEditedAt.toISOString(),
    }));
  },
});

const getDocumentByWorkspaceIdAndDocumentId = tool({
  name: "getDocumentByWorkspaceIdAndDocumentId",
  description: "Fetch a specific document within a worspace with the workspace ID and its ID",
  parameters: z.object({
    workspaceId: z.string(),
    documentId: z.string(),
  }),
  async execute({ workspaceId, documentId }: { workspaceId: string; documentId: string }) {
    const doc = await prisma.document.findUnique({
      where: { workspaceId, id: documentId },
      omit: {
        id: true,
        updatedAt: true,
      },
    });

    if (!doc) return null;

    const filtered = {
      ...doc,
      content: JSON.stringify(doc.content) ?? "",
      publishedAt: doc.publishedAt?.toISOString() ?? null,
      createdAt: doc.createdAt.toISOString(),
      lastEditedAt: doc.lastEditedAt.toISOString(),
    };

    return filtered;
  },
});

export const DocumentContextRetrievalSchema = z.object({
  reasoning: z.string(),
  documents: z
    .array(
      z.object({
        content: z.string(),
        publishedAt: z.string().nullable(),
        createdAt: z.string(),
        lastEditedAt: z.string(),
        workspaceId: z.string(),
        authorId: z.string().nullable(),
        parentId: z.string().nullable(),
        title: z.string(),
        slug: z.string().nullable(),
        headline: z.string().nullable(),
        status: z.enum([
          Prisma.$Enums.DocumentStatus.ARCHIVED,
          Prisma.$Enums.DocumentStatus.DRAFT,
          Prisma.$Enums.DocumentStatus.IN_REVIEW,
          Prisma.$Enums.DocumentStatus.PUBLISHED,
        ]),
        searchText: z.string().nullable(),
        summary: z.string().nullable(),
      })
    )
    .nullable(),
  confidence: z.number().min(0).max(1),
});
Prisma.$Enums.DocumentStatus;
export const DocumentContextRetrievalAgentOptions = {
  instructions: `
You are the Activity Log Context Retrieval Agent.

Your task is to gather all relevant activity log data needed to satisfy the users request based on:

1. The Intent Classifier Agent's output

You MAY call any tools provided to fetch data associated with documents.

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
  name: "Document Context Retrieval Agent",
  model: "gpt-4.1",
  outputType: DocumentContextRetrievalSchema,
  modelSettings: {
    toolChoice: "auto",
    store: false,
    temperature: 0.3,
  } as ModelSettings,
  tools: [listDocumentsByWorkspaceIdTool, getDocumentByWorkspaceIdAndDocumentId],
};
