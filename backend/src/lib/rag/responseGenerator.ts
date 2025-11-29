import { z } from "zod";

export const ResponseGeneratorSchema = z.object({
  response: z.string(),
});

export const ResponseGeneratorAgentOptions = {
  name: "Response Generator",
  instructions: `
You will be given the user's request plus a ranked context string that already prioritizes relevant information.
Produce the final answer to return to the user.

Rules:
- Use only the provided context; do not invent facts.
- If context is insufficient, say so and request the missing detail concisely.
- Keep the response clear and actionable; do not mention internal steps or ranking.
- Respond ONLY with JSON that matches the schema.
`,
  model: "gpt-4.1",
  outputType: ResponseGeneratorSchema,
  modelSettings: {
    toolChoice: "none",
    store: false,
  },
};
