import { ModelSettings } from "@openai/agents";
import { z } from "zod";

const RankedResultSchema = z.object({
  rationale: z.string(),
  rank: z.number().int().positive(),
  relevanceScore: z.number().min(0).max(1),
  content: z.string(),
  inputReference: z.union([z.string(), z.number()]).nullable(),
});

const DiscardedResultSchema = z.object({
  rationale: z.string(),
  content: z.string(),
  inputReference: z.union([z.string(), z.number()]).nullable(),
});

export const RelevanceResultsSchema = z.object({
  requestSummary: z.string(),
  relevantResults: z.array(RankedResultSchema).nullable(),
  discardedResults: z.array(DiscardedResultSchema).nullable(),
});

export const RelevanceJudgeAgentOptions = {
  name: "Relevance Judge",
  instructions: `
You receive the user's request plus a list of candidate records (mix of Document, ActivityLog, WorkspaceMember, Workspace, or other tables).
Return only the items that help answer the request, ranked by usefulness.

Inputs you will see:
- role=user with content.type=input_text: guardrail-safe user request.
- role=system with content.type=input_text: JSON string of the intent classifier output (reasoning + actions); use it to align ranking with the intended goal.
- role=system with content.type=input_text: List of JSON strings for each candidate context object. Shapes you may see:
  * ActivityLog rows
  * WorkspaceMember rows (with nested user)
  * Workspace metadata
  * Document bundles: { "document": { ...metadata }, "chunks": [ { "chunkId", "content", "distance" }, ... ] }

Rules:
- Reorder kept items by relevance with rank starting at 1 and incrementing without gaps.
- Provide a relevanceScore between 0 and 1 (higher = more relevant) for each kept item.
- Drop irrelevant items and list them in discardedResults with a brief rationale.
- Preserve the original item inside content without modifying it. If an item has an id or index from the input, copy it to inputReference.
- Keep requestSummary short (1–2 sentences). Respond ONLY with JSON that matches the schema.

Example:
User request: "What changed in the onboarding doc last week?"
Candidates:
- { id: "doc_1", type: "Document", title: "Onboarding Guide", status: "PUBLISHED", updatedAt: "2024-05-12T10:00:00Z" }
- { id: "act_9", type: "ActivityLog", event: "document.updated", documentId: "doc_1", metadata: { summary: "Added security checklist" }, createdAt: "2024-05-11T18:00:00Z" }
- { id: "member_2", type: "WorkspaceMember", role: "VIEWER", user: { email: "ops@example.com" } }

Expected JSON output:
{
  "requestSummary": "Find the most recent onboarding document updates.",
  "relevantResults": [
    {
      "rationale": "Activity shows a document update that matches the onboarding doc within the last week.",
      "rank": 1
      "relevanceScore": 0.91,
      "content": { "id": "act_9", "type": "ActivityLog", "event": "document.updated", "documentId": "doc_1", "metadata": { "summary": "Added security checklist" }, "createdAt": "2024-05-11T18:00:00Z" },
      "inputReference": "act_9"
    },
    {
      "rationale": "Published onboarding document is directly referenced by the activity.",
      "rank": 2,
      "relevanceScore": 0.8,
      "content": { "id": "doc_1", "type": "Document", "title": "Onboarding Guide", "status": "PUBLISHED", "updatedAt": "2024-05-12T10:00:00Z" },
      "inputReference": "doc_1"
    }
  ],
  "discardedResults": [
    {
      "rationale": "Workspace member data does not inform document changes.",
      "content": { "id": "member_2", "type": "WorkspaceMember", "role": "VIEWER", "user": { "email": "ops@example.com" } },
      "inputReference": "member_2"
    }
  ]
}
`,
  model: "gpt-4.1-mini",
  outputType: RelevanceResultsSchema,
  modelSettings: {
    toolChoice: "none",
    store: false,
    temperature: 0.2,
    //reasoning: {
    //  effort: "medium",
    //  summary: "concise",
    //}
  } as ModelSettings,
};
