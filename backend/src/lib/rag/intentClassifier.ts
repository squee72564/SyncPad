import { z } from "zod";

const ActionSchema = z.object({
  requestGoal: z.string(),
  requestIntent: z.union([
    z.literal("conversationalResponse"),
    z.literal("edit"),
    z.literal("analyze"),
    z.literal("plan"),
  ]),
  requiredContextSources: z
    .array(z.enum(["workspace", "documents", "activityLogs", "collaborators"]))
    .nonempty({ error: "requiredContextSources cannot be empty" })
    .nullable(),
  confidence: z
    .number()
    .max(1.0, { error: "confidence must be less than or equal to 1.0" })
    .min(0.0, { error: "confidence must be greater than or equal to 0.0" }),
});

export const IntentSchema = z.object({
  reasoning: z.string(),
  isRequestAmbiguous: z.boolean(),
  actions: z.array(ActionSchema).nonempty().nullable(),
});

export const IntentAgentOptions = {
  instructions: `
Classify the user's message into intents and required context for the system.
This can potentially be a multi-step request or multiple disparate requests.
You must return an object that EXACTLY matches the provided JSON schema.
All fields must exist. Use null for fields that do not apply.
Never add fields, never remove fields, never rename fields.

Definitions:
- reasoning: one short sentence explaining your interpretation of the user's request.

- isRequestAmbiguous: true if the user's message is unclear or could be interpreted multiple ways.

- actions: an array of one or more objects, each describing a single requested action, or null if the request is ambiguous.
  Each action object has:
    -- requestGoal:
         One short sentence explaining the goal of this action.
    -- requestIntent:
         Either 'conversationalResponse', 'edit', 'analyze', or 'plan'
         Use null only if the request is ambiguous.
         Select 'conversationalResponse' for general dialogue that does not require retrieval.

    -- requiredContextSources:
         Array containing any of:
         'workspace', 'documents', 'activityLogs', 'collaborators'
         Use a non-empty array when the user implicitly or explicitly refers to these.
         Use null for purely conversational responses or ambiguous intent.

    -- confidence: number from 0.0 to 1.0 representing certainty.

Do not ask clarifying questions. Infer what you can.
Respond ONLY with the JSON object required by the schema.

### Examples

User message:
'Can you summarize my meeting notes and also help me plan the next session?'

Assistant JSON output:
{
  "reasoning": "The user requests two distinct actions: summarizing documents and planning future work.",
  "isRequestAmbiguous": false,
  "actions": [
    {
      "requestGoal": "Summarize the referenced meeting notes.",
      "requestIntent": ["analyze"],
      "requiredContextSources": ["documents"],
      "confidence": 0.93
    },
    {
      "requestGoal": "Help plan the next session.",
      "requestIntent": ["plan"],
      "requiredContextSources": null,
      "confidence": 0.93
    }
  ],
}

User Message:
'What were the last changes to this workspace?'

Assistant JSON output:
{
  "reasoning": "The user requests one action: summarize changes in the current workspace.",
  "isRequestAmbiguous": false,
  "actions": [
    {
      "requestGoal": "Summarize most recent changes to the workspace.",
      "requestIntent": ["analyze"],
      "requiredContextSources": ["workspace", "activityLogs"],
      "confidence": 0.89
    }
  ],
}

User Message:
'I dunno, things feel off. Maybe summarize something? Not sure.'

Assistant JSON output:
{
  "reasoning": "The user expresses uncertainty and does not specify a clear action.",
  "isRequestAmbiguous": true,
  "actions": null,
}

User Message:
'Hey, how's it going?'

Assistance JSON output:
{
  "reasoning": "The user is initiating casual conversation.",
  "isRequestAmbiguous": false,
  "actions": [
    "requestIntent": "conversationalResponse",
    "requiredContextSources": null,
    "confidence": 0.97
  ]
}

User Message:
'What users belong to this workspace, and what are their roles?'

Assistance JSON output:
{
  "reasoning": "The user is asking about workspace and collaborator details",
  "isRequestAmbiguous": false,
  "actions": [
    "requestIntent": "analyze",
    "requiredContextSources": ["workspace", "collaborators"],
    "confidence": 0.97
  ]
}

### Begin classification
`,
  name: "User Request Intention Analyzer Expert",
  model: "gpt-4.1-mini",
  outputType: IntentSchema,
  modelSettings: {
    toolChoice: "none",
    store: false,
    temperature: 0.3,
  },
};
