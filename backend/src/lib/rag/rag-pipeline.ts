import { OpenAI } from "openai";
import { type GuardrailResult, type GuardrailBundle, runGuardrails } from "@openai/guardrails";
import { z } from "zod";
import { Agent, handoff, Runner, UserMessageItem, tool, setOpenAIAPI } from "@openai/agents";
import prisma from "@syncpad/prisma-client";
import Prisma, { Prisma as PrismaNamespace } from "@generated/prisma-postgres/index.js";
import config from "@/config/index.ts";
import logger from "@/config/logger.ts";
import { IntentAgentOptions, IntentSchema } from "./intentClassifier.ts";
import { RelevanceJudgeAgentOptions, RelevanceResultsSchema } from "./relevanceJudge.ts";
import { ResponseGeneratorAgentOptions, ResponseGeneratorSchema } from "./responseGenerator.ts";
import {
  AmbiguousRequestResponseAgentOptions,
  AmbiguousRequestResponseSchema,
} from "./ambiguousRequestAgent.ts";

export type Result<T, U> =
  | { success: true; data: T }
  | { success: false; type: "Guardrail"; data: U }
  | { success: false; type: "Agent"; error: string };

const guardrailsConfig: GuardrailBundle = {
  guardrails: [
    {
      name: "Moderation",
      config: {
        categories: [
          "sexual",
          "sexual/minors",
          "hate",
          "hate/threatening",
          "harassment",
          "harassment/threatening",
          "self-harm",
          "self-harm/intent",
          "self-harm/instructions",
          "violence",
          "violence/graphic",
          "illicit",
          "illicit/violent",
        ],
      },
    },
  ],
};

export default class RAGOrchestrator {
  private client: OpenAI;
  private runner: Runner;
  private intentClassifierAgent: Agent<unknown, typeof IntentSchema>;
  private relevanceJudgeAgent: Agent<unknown, typeof RelevanceResultsSchema>;
  private responseGeneratorAgent: Agent<unknown, typeof ResponseGeneratorSchema>;
  private ambiguousRequestResponseAgent: Agent<unknown, typeof AmbiguousRequestResponseSchema>;

  constructor() {
    setOpenAIAPI("responses");

    this.client = new OpenAI({ apiKey: config.LLM_API_KEY, organization: "Syncpad" });
    this.runner = new Runner({
      workflowName: "Syncpad RAG Orchestrator",
      traceMetadata: {
        __trace_source__: "RAG-Orchestrator",
        workflow_id: "wf_692620119e349190ba8174a658c8e0a00a005c7883024fc0",
      },
    });

    this.ambiguousRequestResponseAgent = new Agent({ ...AmbiguousRequestResponseAgentOptions });

    this.responseGeneratorAgent = new Agent({ ...ResponseGeneratorAgentOptions });

    this.relevanceJudgeAgent = new Agent({ ...RelevanceJudgeAgentOptions });

    this.intentClassifierAgent = new Agent({ ...IntentAgentOptions });
  }

  private guardrailsHasTripwire(results: GuardrailResult[]): boolean {
    return (results ?? []).some((r) => r?.tripwireTriggered === true);
  }
  private getGuardrailSafeText(results: any[], fallbackText: string): string {
    for (const r of results ?? []) {
      if (r?.info && "checked_text" in r.info) {
        return r.info.checked_text ?? fallbackText;
      }
    }
    const pii = (results ?? []).find((r) => r?.info && "anonymized_text" in r.info);
    return pii?.info?.anonymized_text ?? fallbackText;
  }

  private buildGuardrailFailOutput(results: GuardrailResult[]) {
    const get = (name: string) =>
      results.find((r: GuardrailResult) => r.info?.guardrail_name === name);

    const mod = get("Moderation"),
      jb = get("Jailbreak"),
      hal = get("Hallucination Detection"),
      nsfw = get("NSFW Text"),
      url = get("URL Filter"),
      custom = get("Custom Prompt Check"),
      pid = get("Prompt Injection Detection"),
      conf = jb?.info?.confidence;
    return {
      moderation: {
        failed:
          mod?.tripwireTriggered === true ||
          ((mod?.info.flagged_categories as unknown[]) ?? []).length > 0,
        flagged_categories: mod?.info.flagged_categories,
      },
      jailbreak: { failed: jb?.tripwireTriggered === true },
      hallucination: {
        failed: hal?.tripwireTriggered === true,
        reasoning: hal?.info.reasoning,
        hallucination_type: hal?.info.hallucination_type,
        hallucinated_statements: hal?.info.hallucinated_statements,
        verified_statements: hal?.info.verified_statements,
      },
      nsfw: { failed: nsfw?.tripwireTriggered === true },
      url_filter: { failed: url?.tripwireTriggered === true },
      custom_prompt_check: { failed: custom?.tripwireTriggered === true },
      prompt_injection: { failed: pid?.tripwireTriggered === true },
    };
  }

  private async runAndApplyGuardrails(inputText: string, config: GuardrailBundle) {
    const results = await runGuardrails(inputText, config, { guardrailLlm: this.client }, true);
    const hasTripwire = this.guardrailsHasTripwire(results);
    const safeText = this.getGuardrailSafeText(results, inputText) ?? inputText;

    return {
      results,
      hasTripwire,
      failOutput: this.buildGuardrailFailOutput(results ?? []),
      passOutput: { safe_text: safeText },
    };
  }

  private async classifyIntent(conversationHistory: UserMessageItem[]) {
    const selectedIntentResponse = await this.runner.run(
      this.intentClassifierAgent,
      conversationHistory
    );

    if (!selectedIntentResponse.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    const result = z.safeParse(IntentSchema, selectedIntentResponse.finalOutput);

    if (!result.success) {
      throw new Error("Agent did not return the correct schema");
    }

    const selectedIntentResult = {
      output_text: JSON.stringify(selectedIntentResponse.finalOutput),
      output_parsed: result.data,
    };

    return selectedIntentResult;
  }

  private retrieveDocumentEmbeddings() {}

  private retrieveDocumentInformation() {}

  private retrieveWorkspaceInformation() {}

  private retrieveActivityLogInformation() {}

  private runRelevanceCheck() {}

  private async composeContext(
    actions: z.infer<typeof IntentSchema>["actions"],
    workspaceId: string
  ) {
    if (!actions || actions.length === 0) {
      throw new Error("composeContext requires a valid actions array");
    }

    let requiredContextSources = new Set<
      "workspace" | "documents" | "activityLogs" | "collaborators"
    >();

    let context: (
      | Partial<Prisma.ActivityLog>
      | Partial<Prisma.Workspace>
      | Partial<Prisma.Document>
      | Partial<Prisma.WorkspaceMember>
    )[] = [];

    for (const action of actions) {
      if (!action.requiredContextSources) continue;

      for (const requiredContext of action.requiredContextSources) {
        requiredContextSources.add(requiredContext);
      }
    }

    if (requiredContextSources.has("activityLogs")) {
      const activityLogs = await prisma.activityLog.findMany({
        where: {
          workspaceId: workspaceId,
        },
      });
      context.push(...activityLogs);
    }

    if (requiredContextSources.has("collaborators")) {
      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: workspaceId,
        },
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

      context.push(...workspaceMembers);
    }

    if (requiredContextSources.has("documents")) {
      // Get embedding for user request, and then do some kind of similarity search based on documentEmbeddings
      // Take the top X unique documents above some certain distance threshold and get them to push into context
    }

    if (requiredContextSources.has("workspace")) {
      const workspaceMetadata = await prisma.workspace.findUnique({
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

      if (workspaceMetadata) {
        context.push(workspaceMetadata);
      }
    }

    return context;
  }

  private async handleAmbiguousRequest(userInput: string, reasoning: string) {
    const ambiguousRequestResponse = await this.runner.run(this.ambiguousRequestResponseAgent, [
      { role: "user", content: [{ type: "input_text", text: userInput }] },
      { role: "Agent", context: [{ type: "agent_reasoning", text: reasoning }] },
    ]);

    if (!ambiguousRequestResponse.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    const result = AmbiguousRequestResponseSchema.safeParse(ambiguousRequestResponse.finalOutput);

    if (!result.success) {
      throw new Error("Agent did not return the correct schema");
    }

    const selectedIntentResult = {
      output_text: JSON.stringify(ambiguousRequestResponse.finalOutput),
      output_parsed: result.data,
    };

    return selectedIntentResult;
  }

  // We probably want to add the ability to insert previous historical context from the chat
  // We need to figure out how this should be formatted for conversationHistory in a way the
  // model will understand well. For example the history will likely be a back and forth between
  // the user and agent with different roles specified ect

  async runRAGPipeline(
    workspaceId: string,
    userInput: string,
    _history: unknown
  ): Promise<Result<Object, ReturnType<typeof this.buildGuardrailFailOutput>>> {
    logger.debug("Running RAG Pipeline: ", {
      userInput: userInput,
    });

    const {
      hasTripwire: guardrailsHasTripwire,
      failOutput: guardrailsFailOutput,
      passOutput: guardrailsPassOutput,
    } = await this.runAndApplyGuardrails(userInput, guardrailsConfig);

    if (guardrailsHasTripwire) {
      logger.debug("User request failed guardrails: ", {
        guardrailsFailOutput,
      });

      return {
        success: false,
        type: "Guardrail",
        data: guardrailsFailOutput,
      };
    }

    logger.debug("User request passed guardrails: ", {
      guardrailsPassOutput,
    });

    const conversationHistory: UserMessageItem[] = [
      { role: "user", content: [{ type: "input_text", text: guardrailsPassOutput.safe_text }] },
      // Figure out how to properly add historical chat context
    ];

    try {
      const { output_text, output_parsed } = await this.classifyIntent(conversationHistory);

      logger.debug("Ran agent to classify intent of user query: ", {
        output_parsed,
        output_text,
      });

      if (output_parsed.isRequestAmbiguous) {
        const response = await this.handleAmbiguousRequest(
          guardrailsPassOutput.safe_text,
          output_parsed.reasoning
        );
        return {
          success: false,
          type: "Agent",
          error: response.output_parsed.userMessage,
        };
      }

      if (!output_parsed.actions || output_parsed.actions.length === 0) {
        throw new Error("Intent is not ambiguous but no actions generated");
      }

      const context = await this.composeContext(output_parsed.actions, workspaceId);

      const finalAnswer: string | null = "test";

      if (!finalAnswer || !finalAnswer.length) {
        throw new Error("RAG Failed");
      }

      return {
        success: true,
        data: {},
      };
    } catch (error) {
      return {
        success: false,
        type: "Agent",
        error: error instanceof Error ? error.message : "RAG Failed",
      };
    }
  }
}
