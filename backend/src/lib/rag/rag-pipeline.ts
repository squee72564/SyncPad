import { OpenAI } from "openai";
import { type GuardrailResult, type GuardrailBundle, runGuardrails } from "@openai/guardrails";
import { z } from "zod";
import {
  Agent,
  OpenAIProvider,
  Runner,
  UserMessageItem,
  setDefaultOpenAIKey,
  setOpenAIAPI,
  setTracingExportApiKey,
} from "@openai/agents";
import prisma from "@syncpad/prisma-client";
import Prisma, { Prisma as PrismaNamespace } from "@generated/prisma-postgres/index.js";
import config from "@/config/index.ts";
import logger from "@/config/logger.ts";
import { IntentAgentOptions, IntentSchema } from "./intentClassifierAgent.ts";
import { RelevanceJudgeAgentOptions, RelevanceResultsSchema } from "./relevanceJudge.ts";
import { ResponseGeneratorAgentOptions, ResponseGeneratorSchema } from "./responseGenerator.ts";
import {
  AmbiguousRequestResponseAgentOptions,
  AmbiguousRequestResponseSchema,
} from "./ambiguousRequestAgent.ts";
import { QueryNormalizerAgentOptions, QueryNormalizerAgentSchema } from "./queryNormalizerAgent.ts";
import { ContextRetrievalAgentOptions, ContextRetrievalSchema } from "./contextRetrievalAgent.ts";

export type Result<U> =
  | { success: true; data: string }
  | { success: false; type: "InputGuardrail"; data: U }
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
  private queryNormalizerAgent: Agent<unknown, typeof QueryNormalizerAgentSchema>;
  private relevanceJudgeAgent: Agent<unknown, typeof RelevanceResultsSchema>;
  private responseGeneratorAgent: Agent<unknown, typeof ResponseGeneratorSchema>;
  private ambiguousRequestResponseAgent: Agent<unknown, typeof AmbiguousRequestResponseSchema>;
  private contextRetrivalAgent: Agent<unknown, typeof ContextRetrievalSchema>;

  constructor() {
    this.client = new OpenAI({ apiKey: config.LLM_API_KEY });
    this.runner = new Runner({
      workflowName: "Syncpad RAG Orchestration",
      modelProvider: new OpenAIProvider({
        apiKey: config.LLM_API_KEY,
        useResponses: true,
      }),
    });

    setOpenAIAPI("responses");
    setDefaultOpenAIKey(config.LLM_API_KEY);
    setTracingExportApiKey(config.LLM_API_KEY);

    this.ambiguousRequestResponseAgent = new Agent({ ...AmbiguousRequestResponseAgentOptions });

    this.responseGeneratorAgent = new Agent({ ...ResponseGeneratorAgentOptions });

    this.relevanceJudgeAgent = new Agent({ ...RelevanceJudgeAgentOptions });

    this.intentClassifierAgent = new Agent({ ...IntentAgentOptions });

    this.queryNormalizerAgent = new Agent({ ...QueryNormalizerAgentOptions });

    this.contextRetrivalAgent = new Agent({ ...ContextRetrievalAgentOptions });
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

  private async normalizeQuery(conversationHistory: UserMessageItem[]) {
    const normalizedQueriesResponse = await this.runner.run(
      this.queryNormalizerAgent,
      conversationHistory
    );

    if (!normalizedQueriesResponse) {
      throw new Error("Query normalizer Agent result is undefined");
    }

    const result = QueryNormalizerAgentSchema.safeParse(normalizedQueriesResponse.finalOutput);

    if (!result.success) {
      throw new Error("Query normalizer Agent did not return correct schema");
    }

    const normalizedQueryResult = {
      output_text: JSON.stringify(normalizedQueriesResponse.finalOutput),
      output_parsed: result.data,
    };

    return normalizedQueryResult;
  }

  private async classifyIntent(conversationHistory: UserMessageItem[]) {
    const selectedIntentResponse = await this.runner.run(
      this.intentClassifierAgent,
      conversationHistory
    );

    if (!selectedIntentResponse.finalOutput) {
      throw new Error("Intent Agent result is undefined");
    }

    const result = IntentSchema.safeParse(selectedIntentResponse.finalOutput);

    if (!result.success) {
      throw new Error("Intent Agent did not return the correct schema");
    }

    const selectedIntentResult = {
      output_text: JSON.stringify(selectedIntentResponse.finalOutput),
      output_parsed: result.data,
    };

    return selectedIntentResult;
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
    limit = 10,
    maxDistance = 0.55,
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

  private async handleAmbiguousRequest(userInput: string, reasoning: string) {
    const ambiguousRequestResponse = await this.runner.run(this.ambiguousRequestResponseAgent, [
      {
        role: "user",
        content: [{ type: "input_text", text: userInput }],
        context: { description: "This is the ambiguous user input" },
      },
      {
        role: "system",
        content: [{ type: "input_text", text: reasoning }],
        context: { description: "This is the reasoning as to why the request is ambiguous" },
      },
    ]);

    if (!ambiguousRequestResponse.finalOutput) {
      throw new Error("Ambiguous Request Response Agent result is undefined");
    }

    const result = AmbiguousRequestResponseSchema.safeParse(ambiguousRequestResponse.finalOutput);

    if (!result.success) {
      throw new Error("Ambiguous Request Reponse Agent did not return the correct schema");
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
      {
        role: "user",
        content: [{ type: "input_text", text: userInput }],
        context: { description: "This is the user input" },
      },
      {
        role: "system",
        content: [{ type: "input_text", text: intentSchemaOutput }],
        context: {
          description:
            "This is a schema generated by the intent classifier agent. It breaks down the intent of the request into actions",
        },
      },
      {
        role: "system",
        content: [
          ...context.map((contextObject) => ({
            type: "input_text",
            text: JSON.stringify(contextObject),
          })),
        ],
        context: {
          description:
            "This is application data that was retrieved for this user request. Only use these for your task. If there is nothing do not insert any data for the response.",
        },
      },
    ]);

    if (!relevanceJudgeResponse.finalOutput) {
      throw new Error("Relevance Judge Agent result is undefined");
    }

    const result = RelevanceResultsSchema.safeParse(relevanceJudgeResponse.finalOutput);

    if (!result.success) {
      throw new Error("Relevance Judge Agent did not return the correct schema");
    }

    const relevanceCheckedContext = {
      output_text: JSON.stringify(relevanceJudgeResponse.finalOutput),
      output_parsed: result.data,
    };

    return relevanceCheckedContext;
  }

  private async getContextFromAgent(
    userInput: string,
    workspaceId: string,
    intentSchemaOutput: string
  ) {
    const contextRetrievalResponse = await this.runner.run(this.contextRetrivalAgent, [
      {
        role: "user",
        content: [{ type: "input_text", text: userInput }],
        context: { description: "This is the user input" },
      },
      {
        role: "system",
        content: [{ type: "input_text", text: intentSchemaOutput }],
        context: {
          description:
            "This is a schema generated by the intent classifier agent. It breaks down the intent of the request into actions",
        },
      },
      {
        role: "system",
        content: [{ type: "input_text", text: JSON.stringify({ workspaceId: workspaceId }) }],
        context: {
          description: "This is the workspace ID. You will need this for all tool calling ",
        },
      },
    ]);

    if (!contextRetrievalResponse.finalOutput) {
      throw Error("Context Retrieval Agent result is undefined");
    }

    const result = ContextRetrievalSchema.safeParse(contextRetrievalResponse.finalOutput);

    if (!result.success) {
      throw Error("Context Retrieval Agent did not return the correct schema");
    }

    return {
      output_text: contextRetrievalResponse.finalOutput,
      output_parsed: result.data,
    };
  }

  private async generateFinalResponse(
    userInput: string,
    intentSchemaOutput: string,
    relevanceCheckedContext: object,
    additionalContext: object
  ) {
    const response = await this.runner.run(this.responseGeneratorAgent, [
      {
        role: "user",
        content: [{ type: "input_text", text: userInput }],
        context: { description: "This is the user input" },
      },
      {
        role: "system",
        content: [{ type: "input_text", text: JSON.stringify(intentSchemaOutput) }],
        context: {
          description:
            "This is a schema generated by the intent classifier agent. It breaks down the intent of the request into actions",
        },
      },
      {
        role: "system",
        content: [{ type: "input_text", text: JSON.stringify(relevanceCheckedContext) }],
        context: {
          description: "This is relevant content that has been ranked by a relevance judge agent.",
        },
      },
      {
        role: "system",
        content: [{ type: "input_text", text: JSON.stringify(additionalContext) }],
        context: {
          description: "This is additional context pulled in from a previous agent.",
        },
      },
    ]);

    if (!response.finalOutput) {
      throw new Error("Final Response Agent result is undefined");
    }

    const parsed = ResponseGeneratorSchema.safeParse(response.finalOutput);

    if (!parsed.success) {
      throw new Error("Final Response Agent did not return the correct schema");
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
    logger.debug("Running RAG Pipeline with user input: ", {
      userInput: userInput,
    });

    const {
      hasTripwire: guardrailsHasTripwire,
      failOutput: guardrailsFailOutput,
      passOutput: inputPassOutput,
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

    const conversationHistory: UserMessageItem[] = [
      { role: "user", content: [{ type: "input_text", text: inputPassOutput.safe_text }] },
      // Figure out how to properly add historical chat context
    ];

    try {
      const [intentResult, normalizedQueryResult] = await Promise.all([
        this.classifyIntent(conversationHistory),
        this.normalizeQuery(conversationHistory),
      ]);

      logger.debug("Classified intent and normalized queries", {
        intent: intentResult.output_parsed,
        queries: normalizedQueryResult.output_parsed,
      });

      if (intentResult.output_parsed.isRequestAmbiguous) {
        const response = await this.handleAmbiguousRequest(
          inputPassOutput.safe_text,
          intentResult.output_parsed.reasoning
        );
        return {
          success: false,
          type: "Agent",
          error: response.output_parsed.userMessage,
        };
      }

      if (!intentResult.output_parsed.actions || intentResult.output_parsed.actions.length === 0) {
        throw new Error("Intent is not ambiguous but no actions generated");
      }

      const documentCollections = normalizedQueryResult.output_parsed.normalizedQueries
        ? await Promise.all(
            normalizedQueryResult.output_parsed.normalizedQueries.map((normQueries) =>
              this.getDocumentContext(workspaceId, normQueries.normalizedQuery)
            )
          )
        : [];
      const uniqueDocumentSet = new Set<string>();

      const uniqueDocuments = documentCollections.flatMap((documentCollection) =>
        documentCollection.filter((documentData) => {
          if (uniqueDocumentSet.has(documentData.document.id)) {
            return false;
          }
          uniqueDocumentSet.add(documentData.document.id);
          return true;
        })
      );

      logger.debug("Potential Relevant Documents: ", {
        uniqueDocuments: uniqueDocuments,
      });

      const obj = {
        requestSummary: "There are no relevant documents based on the user request",
        relevantResults: null,
        discardedResults: null,
      };

      const relevanceCheck =
        uniqueDocuments.length === 0
          ? Promise.resolve({ output_text: JSON.stringify(obj), output_parsed: obj })
          : this.contextRelevanceCheck(uniqueDocuments, userInput, intentResult.output_text);

      const [relevanceCheckedDocuments, additionalContext] = await Promise.all([
        relevanceCheck,
        this.getContextFromAgent(userInput, workspaceId, intentResult.output_text),
      ]);

      const { output_parsed: relevanceCheckedChunks, output_text: _relevanceCheckedChunks } =
        relevanceCheckedDocuments;
      const { output_parsed: additionalContextParsed, output_text: _additionalContextText } =
        additionalContext;

      logger.debug("Data after relevance check and context retrieval from agent: ", {
        relevanceCheck: relevanceCheckedChunks,
        additional_context: additionalContextParsed,
      });

      const documentChunksAbsent =
        !relevanceCheckedChunks.relevantResults ||
        relevanceCheckedChunks.relevantResults.length == 0;
      const additionalContentAbsent =
        !additionalContextParsed.activityLogs &&
        !additionalContextParsed.workspace &&
        !additionalContextParsed.workspaceMembers;

      if (documentChunksAbsent && additionalContentAbsent) {
        const response = await this.handleAmbiguousRequest(
          inputPassOutput.safe_text,
          `
          There is no relevant context for this request. Tell the user that you could not find any information
          about the request, and that you would be happy to answer any other questions they have.
          `
        );
        return {
          success: false,
          type: "Agent",
          error: response.output_parsed.userMessage,
        };
      }

      const MAX_RELEVANT_RESULTS = 8;
      const MIN_RELEVANCE_SCORE = 0.5;

      const filteredRelevantResults = relevanceCheckedChunks.relevantResults
        ? relevanceCheckedChunks.relevantResults
            .filter((item) => item.relevanceScore >= MIN_RELEVANCE_SCORE)
            .sort((a, b) => a.rank - b.rank)
            .slice(0, MAX_RELEVANT_RESULTS)
        : [];

      const trimmedContext = {
        relevantResults: filteredRelevantResults,
      };

      const response = await this.generateFinalResponse(
        inputPassOutput.safe_text,
        intentResult.output_text,
        {
          requestSummary: relevanceCheckedChunks.requestSummary,
          relevantResults: trimmedContext,
        },
        additionalContext
      );

      logger.debug("Final response: ", {
        response: response.output_parsed.response,
      });

      return {
        success: true,
        data: response.output_parsed.response,
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
