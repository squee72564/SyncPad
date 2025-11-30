import { z } from "zod";
import { ModelSettings } from "@openai/agents";

export const ResponseGeneratorSchema = z.object({
  response: z.string(),
});

export const ResponseGeneratorAgentOptions = {
  name: "Response Generator",
  instructions: `
Produce the final user-facing answer using only the provided context.

Rules:
- Use only the provided context; do not invent facts.
- If context is insufficient, say so and request the missing detail concisely.
- Keep the response clear and actionable; do not mention internal steps or ranking.
- Respond ONLY with JSON that matches the schema.
`,
  model: "gpt-4.1-mini",
  outputType: ResponseGeneratorSchema,
  modelSettings: {
    toolChoice: "none",
    store: false,
    temperature: 0.3,
  } as ModelSettings,
};
