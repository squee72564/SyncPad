import { z } from "zod";

export const ResponseGeneratorSchema = z.object({
  response: z.string(),
});

export const ResponseGeneratorAgentOptions = {
  name: "Response Generator",
  instructions: `
You will be given:
- role=user with content.type=input_text: guardrail-safe user request.
- role=intent_classifier_agent with context.type=agent_reasoning: JSON string of the intent classifier output (reasoning + actions).
- role=relevance_judge with context.type=context_object: JSON string containing ranked, filtered context. Each object follows:
  {
    "requestSummary": "...",
    "relevantResults": [
      {
        "rank": 1,
        "relevanceScore": 0.9,
        "rationale": "...",
        "content": { ...original record... },
        "inputReference": "optional"
      },
      ...
    ],
    "discardedResults": [...]
  }
  Records may include document bundles like { "document": { id, title, summary, status, updatedAt, workspaceId }, "chunks": [ { chunkId, content, distance }, ... ] } or other tables (ActivityLog, WorkspaceMember, Workspace).

Produce the final user-facing answer using only the provided context.

Rules:
- Use only the provided context; do not invent facts.
- If context is insufficient, say so and request the missing detail concisely.
- Keep the response clear and actionable; do not mention internal steps or ranking.
- Respond ONLY with JSON that matches the schema.

Example (simplified):
User asks: "What changed in the onboarding doc last week?"
Relevant context includes a Document and ActivityLog update about adding a security checklist.
Expected response JSON:
{
  "response": "The onboarding guide was updated last week to add a security checklist to the process."
}
`,
  model: "gpt-4.1",
  outputType: ResponseGeneratorSchema,
  modelSettings: {
    toolChoice: "none",
    store: false,
  },
};
