import { OpenAI } from "openai";
import { type GuardrailResult, type GuardrailBundle, runGuardrails } from "@openai/guardrails";
import { z } from "zod";
import { Agent, Runner, UserMessageItem, setOpenAIAPI } from "@openai/agents";
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

export type Result<U> =
  | { success: true; data: string }
  | { success: false; type: "InputGuardrail"; data: U }
  | { success: false; type: "OuputGuardrail"; data: U }
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

const outputGuardrailsConfig: GuardrailBundle = {
  guardrails: [
    {
      name: "Hallucination Detection",
      config: {
        categories: ["hallucination"],
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

  private async getWorkspaceContext(workspaceId: string) {
    return prisma.workspace.findUnique({
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
  }

  private async getActivityLogContext(workspaceId: string) {
    return prisma.activityLog.findMany({
      where: {
        workspaceId: workspaceId,
      },
    });
  }

  private async getWorkspaceMemberContext(workspaceId: string) {
    return prisma.workspaceMember.findMany({
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
  }

  private async generateQueryEmbedding(text: string) {
    const embeddingResponse = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const embedding = embeddingResponse.data?.[0]?.embedding;

    if (!embedding) {
      throw new Error("Failed to generate embedding for user query");
    }

    return embedding;
  }

  private async findSimilarDocuments(
    workspaceId: string,
    queryEmbedding: number[],
    limit = 12,
    maxDistance = 0.6, // TODO: tune with offline evals for this workspace/content mix
    maxChunksPerDocument = 3
  ) {
    const embeddingVector = PrismaNamespace.sql`ARRAY[${PrismaNamespace.join(queryEmbedding)}]::vector`;

    const rows = await prisma.$queryRaw<
      Array<{ documentId: string; chunkId: string; content: string; distance: number }>
    >(PrismaNamespace.sql`
      SELECT "documentId", "chunkId", "content", (embedding <=> ${embeddingVector}) AS distance
      FROM "document_embedding"
      WHERE "workspaceId" = ${workspaceId}
        AND (embedding <=> ${embeddingVector}) <= ${maxDistance}
      ORDER BY embedding <=> ${embeddingVector}
      LIMIT ${limit * maxChunksPerDocument}
    `);

    const grouped = new Map<
      string,
      Array<{ chunkId: string; content: string; distance: number }>
    >();

    for (const row of rows) {
      if (row.distance > maxDistance) continue;
      const collection = grouped.get(row.documentId) ?? [];
      if (collection.length >= maxChunksPerDocument) continue;
      collection.push({ chunkId: row.chunkId, content: row.content, distance: row.distance });
      grouped.set(row.documentId, collection);
    }

    return grouped;
  }

  private async getDocumentContext(workspaceId: string, userInput: string) {
    const documentContext: Array<{
      document: Pick<Prisma.Document, "id" | "title" | "summary" | "status" | "updatedAt">;
      chunks: Array<{ chunkId: string; content: string; distance: number }>;
    }> = [];

    const queryEmbedding = await this.generateQueryEmbedding(userInput);
    const similarDocuments = await this.findSimilarDocuments(workspaceId, queryEmbedding);
    const documentIds = Array.from(similarDocuments.keys());

    if (documentIds.length) {
      const documents = await prisma.document.findMany({
        where: {
          id: {
            in: documentIds,
          },
        },
        select: {
          id: true,
          title: true,
          summary: true,
          status: true,
          updatedAt: true,
        },
      });

      const documentLookup = new Map(documents.map((doc) => [doc.id, doc]));

      for (const [documentId, chunks] of similarDocuments.entries()) {
        const document = documentLookup.get(documentId);
        if (!document) continue;

        documentContext.push({
          document,
          chunks,
        });
      }
    }

    return documentContext;
  }

  private async composeContext(
    actions: z.infer<typeof IntentSchema>["actions"],
    workspaceId: string,
    userInput: string
  ) {
    if (!actions || actions.length === 0) {
      throw new Error("composeContext requires a valid actions array");
    }

    let requiredContextSources = new Set<
      "workspace" | "documents" | "activityLogs" | "collaborators"
    >();

    let context: (
      | Awaited<ReturnType<typeof this.getActivityLogContext>>[number]
      | NonNullable<Awaited<ReturnType<typeof this.getWorkspaceContext>>>
      | Awaited<ReturnType<typeof this.getWorkspaceMemberContext>>[number]
      | Awaited<ReturnType<typeof this.getDocumentContext>>[number]
    )[] = [];

    for (const action of actions) {
      if (!action.requiredContextSources) continue;

      for (const requiredContext of action.requiredContextSources) {
        requiredContextSources.add(requiredContext);
      }
    }
    const activityLogsPromise = requiredContextSources.has("activityLogs")
      ? this.getActivityLogContext(workspaceId)
      : Promise.resolve<Awaited<ReturnType<typeof this.getActivityLogContext>>>([]);

    const workspaceMembersPromise = requiredContextSources.has("collaborators")
      ? this.getWorkspaceMemberContext(workspaceId)
      : Promise.resolve<Awaited<ReturnType<typeof this.getWorkspaceMemberContext>>>([]);

    const workspaceMetadataPromise = requiredContextSources.has("workspace")
      ? this.getWorkspaceContext(workspaceId)
      : Promise.resolve<Awaited<ReturnType<typeof this.getWorkspaceContext>>>(null);

    const documentPromise = requiredContextSources.has("documents")
      ? this.getDocumentContext(workspaceId, userInput)
      : Promise.resolve<Awaited<ReturnType<typeof this.getDocumentContext>>>([]);

    const [activityLogs, workspaceMembers, workspaceMetadata, documents] = await Promise.all([
      activityLogsPromise,
      workspaceMembersPromise,
      workspaceMetadataPromise,
      documentPromise,
    ]);

    context.push(...documents);
    context.push(...activityLogs);
    context.push(...workspaceMembers);
    if (workspaceMetadata !== null) {
      context.push(workspaceMetadata);
    }

    return context;
  }

  private async handleAmbiguousRequest(userInput: string, reasoning: string) {
    const ambiguousRequestResponse = await this.runner.run(this.ambiguousRequestResponseAgent, [
      { role: "user", content: [{ type: "input_text", text: userInput }] },
      { role: "intent_classifier_agent", context: [{ type: "agent_reasoning", text: reasoning }] },
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

  private async contextRelevanceCheck(
    context: object[],
    userInput: string,
    intentSchemaOutput: string
  ) {
    const relevanceJudgeResponse = await this.runner.run(this.relevanceJudgeAgent, [
      { role: "user", content: [{ type: "input_text", text: userInput }] },
      {
        role: "intent_classifier_agent",
        context: [{ type: "agent_reasoning", text: intentSchemaOutput }],
      },
      {
        role: "context_references",
        context: context.map((contextObject) => ({
          type: "context_object",
          text: JSON.stringify(contextObject),
        })),
      },
    ]);

    if (!relevanceJudgeResponse.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    const result = RelevanceResultsSchema.safeParse(relevanceJudgeResponse.finalOutput);

    if (!result.success) {
      throw new Error("Agent did not return the correct schema");
    }

    const relevanceCheckedContext = {
      output_text: JSON.stringify(relevanceJudgeResponse.finalOutput),
      output_parsed: result.data,
    };

    return relevanceCheckedContext;
  }

  private async generateFinalResponse(
    userInput: string,
    intentSchemaOutput: string,
    relevanceCheckedContext: object
  ) {
    const response = await this.runner.run(this.responseGeneratorAgent, [
      { role: "user", content: [{ type: "input_text", text: userInput }] },
      {
        role: "intent_classifier_agent",
        context: [{ type: "agent_reasoning", text: intentSchemaOutput }],
      },
      {
        role: "relevance_judge",
        context: [{ type: "context_object", text: JSON.stringify(relevanceCheckedContext) }],
      },
    ]);

    if (!response.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    const parsed = ResponseGeneratorSchema.safeParse(response.finalOutput);

    if (!parsed.success) {
      throw new Error("Agent did not return the correct schema");
    }

    return {
      output_text: JSON.stringify(response.finalOutput),
      output_parsed: parsed.data,
    };
  }

  // We probably want to add the ability to insert previous historical context from the chat
  // We need to figure out how this should be formatted for conversationHistory in a way the
  // model will understand well. For example the history will likely be a back and forth between
  // the user and agent with different roles specified ect

  async runRAGPipeline(
    workspaceId: string,
    userInput: string,
    _history: unknown
  ): Promise<Result<ReturnType<typeof this.buildGuardrailFailOutput>>> {
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
        type: "InputGuardrail",
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

      const context = await this.composeContext(
        output_parsed.actions,
        workspaceId,
        guardrailsPassOutput.safe_text
      );

      // Now that we have the context, we need to pass this into the relevanceJudgeAgent
      // this agent should rerank and filter this context to get the most relevant context for the user input
      // I think it may be wise to use the user input, the parsed output from the IntentClassifierAgent
      // (so we have the intent as well as each action item we need to complete), and the context we pulled from the database
      // This agent should get relevant and non-relvant stuff and send it to the last agent that will compose the response
      const relevanceCheckedContext = await this.contextRelevanceCheck(
        context,
        userInput,
        output_text
      );

      logger.debug("Relevance Check Summary: ", {
        summary: relevanceCheckedContext.output_parsed.requestSummary,
      });
      logger.debug("Relevant Context: ", relevanceCheckedContext.output_parsed.relevantResults);
      logger.debug("Discarded Context: ", relevanceCheckedContext.output_parsed.discardedResults);

      const MAX_RELEVANT_RESULTS = 8;
      const MIN_RELEVANCE_SCORE = 0.5;

      const filteredRelevantResults = relevanceCheckedContext.output_parsed.relevantResults
        .filter((item) => item.relevanceScore >= MIN_RELEVANCE_SCORE)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, MAX_RELEVANT_RESULTS);

      const trimmedContext = {
        ...relevanceCheckedContext.output_parsed,
        relevantResults: filteredRelevantResults,
      };

      const response = await this.generateFinalResponse(
        guardrailsPassOutput.safe_text,
        output_text,
        trimmedContext
      );

      const {
        hasTripwire: outputTripwire,
        failOutput: outputFailOutput,
        passOutput: outputPassOutput,
      } = await this.runAndApplyGuardrails(response.output_parsed.response, outputGuardrailsConfig);

      logger.debug("Final response: ", {
        response: response.output_parsed.response,
      });

      if (outputTripwire) {
        return {
          success: false,
          type: "OuputGuardrail",
          data: outputFailOutput,
        };
      }

      return {
        success: true,
        data: outputPassOutput.safe_text,
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
