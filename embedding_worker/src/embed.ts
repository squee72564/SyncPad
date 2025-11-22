import { performance } from "node:perf_hooks";
import config, { type Env } from "@/config/config.ts";
import logger from "@/config/logger.ts";

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

type ProviderOptions = {
  maxBatchSize: number;
  concurrency: number;
  timeoutMs: number;
  maxTokensPerInput: number;
  maxRetries: number;
};

type EmbeddingProviderName = Env["EMBEDDING_PROVIDER"];

type EmbeddingProviderConfig = ProviderOptions & {
  provider: EmbeddingProviderName;
  model: string;
  baseUrl?: string;
  apiKey?: string;
};

const TRANSIENT_ERROR_STATUS = new Set([408, 429, 500, 502, 503, 504]);

class Semaphore {
  private available: number;
  private queue: Array<() => void> = [];

  constructor(private readonly limit: number) {
    this.available = limit;
  }

  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available -= 1;
      return () => this.release();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.available -= 1;
        resolve(() => this.release());
      });
    });
  }

  private release() {
    this.available += 1;
    if (this.queue.length > 0 && this.available > 0) {
      const next = this.queue.shift();
      next?.();
    }
  }
}

type EmbeddingBatch = {
  inputs: string[];
  startIndex: number;
};

const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
};

abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  private readonly concurrencyGate: Semaphore;

  constructor(
    protected readonly config: EmbeddingProviderConfig,
    private readonly options: ProviderOptions
  ) {
    this.concurrencyGate = new Semaphore(options.concurrency);
  }

  generateEmbedding(text: string): Promise<number[]> {
    return this.generateEmbeddings([text]).then(([vector]) => vector ?? []);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    const batches = this.createBatches(texts);
    const results: Array<number[] | undefined> = new Array(texts.length).fill(undefined);

    const tasks = batches.map(async (batch) => {
      const release = await this.concurrencyGate.acquire();
      try {
        const vectors = await this.executeWithRetry(batch.inputs);
        return { startIndex: batch.startIndex, vectors };
      } finally {
        release();
      }
    });

    const completed = await Promise.all(tasks);

    for (const { startIndex, vectors } of completed) {
      for (let i = 0; i < vectors.length; i++) {
        results[startIndex + i] = vectors[i];
      }
    }

    if (results.some((vector) => !Array.isArray(vector))) {
      throw new EmbeddingError("Failed to generate embeddings for all inputs", undefined, true);
    }

    if (results.some((vector) => vector === undefined)) {
      throw new EmbeddingError("Some embeddings are missing in the results", undefined, true);
    }

    return results as number[][];
  }

  private createBatches(texts: string[]): EmbeddingBatch[] {
    const batches: EmbeddingBatch[] = [];
    let current: string[] = [];
    let currentTokens = 0;
    let currentStartIndex = 0;

    for (let index = 0; index < texts.length; index++) {
      const text = texts[index];

      if (!text || text.trim().length === 0) {
        continue;
      }

      this.ensureWithinLimits(text);
      const estimatedTokens = this.estimateTokens(text);

      if (
        current.length >= this.options.maxBatchSize ||
        currentTokens + estimatedTokens > this.options.maxTokensPerInput * this.options.maxBatchSize
      ) {
        if (current.length > 0) {
          batches.push({ inputs: current, startIndex: currentStartIndex });
          current = [];
          currentTokens = 0;
        }
      }

      if (current.length === 0) {
        currentStartIndex = index;
      }

      current.push(text);
      currentTokens += estimatedTokens;
    }

    if (current.length > 0) {
      batches.push({ inputs: current, startIndex: currentStartIndex });
    }

    return batches;
  }

  private ensureWithinLimits(text: string) {
    const tokens = this.estimateTokens(text);
    if (tokens > this.options.maxTokensPerInput) {
      throw new Error(
        `Input exceeds maximum tokens per request: got ${tokens}, limit ${this.options.maxTokensPerInput}`
      );
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / config.EMBEDDING_CHUNK_AVG_CHARS_PER_TOKEN);
  }

  private async executeWithRetry(batch: string[], attempt = 1): Promise<number[][]> {
    const start = performance.now();
    try {
      const response = await this.callProvider(batch);
      logger.info("Embedding batch completed", {
        provider: this.config.provider,
        model: this.config.model,
        batchSize: batch.length,
        durationMs: Math.round(performance.now() - start),
        attempt,
      });
      return response;
    } catch (error) {
      const handled = this.shouldRetry(error);

      logger.error("Embedding batch failed", {
        provider: this.config.provider,
        batchSize: batch.length,
        attempt,
        error,
        willRetry: handled,
      });

      const nextAttempt = attempt + 1;

      if (!handled || nextAttempt > this.options.maxRetries) {
        throw error;
      }

      const delay = this.getBackoffDelay(attempt);
      await this.delay(delay);
      return this.executeWithRetry(batch, nextAttempt);
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof EmbeddingError) {
      return error.isRetriable && error.statusCode !== undefined
        ? TRANSIENT_ERROR_STATUS.has(error.statusCode)
        : error.isRetriable;
    }

    if (error instanceof TypeError) {
      // Fetch throws TypeError on network errors/timeouts.
      return true;
    }

    return false;
  }

  private getBackoffDelay(attempt: number): number {
    const base = 500 * 2 ** (attempt - 1);
    const jitter = Math.random() * 0.2 * base;
    return Math.min(base + jitter, 10_000);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected abstract callProvider(batch: string[]): Promise<number[][]>;
}

class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isRetriable = false
  ) {
    super(message);
    this.name = "EmbeddingError";
  }
}

class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(config: EmbeddingProviderConfig, options: ProviderOptions) {
    super(config, options);
  }

  protected async callProvider(batch: string[]): Promise<number[][]> {
    const url = this.config.baseUrl ?? "https://api.openai.com/v1/embeddings";

    if (!this.config.apiKey) {
      throw new EmbeddingError("OpenAI API key is not configured");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        input: batch,
        encoding_format: "float",
      }),
      signal: createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new EmbeddingError(
        `OpenAI request failed: ${errorBody}`,
        response.status,
        response.status >= 500
      );
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };

    return data.data.map((item) => item.embedding);
  }
}

class SelfHostedEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(config: EmbeddingProviderConfig, options: ProviderOptions) {
    super(config, options);
  }

  protected async callProvider(batch: string[]): Promise<number[][]> {
    if (!this.config.baseUrl) {
      throw new EmbeddingError("Base URL is required for self-hosted embedding provider");
    }

    const response = await fetch(this.config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        inputs: batch,
        model: this.config.model,
      }),
      signal: createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new EmbeddingError(
        `Self-hosted embedding request failed: ${errorBody}`,
        response.status,
        response.status >= 500
      );
    }

    const result = (await response.json()) as { embeddings: number[][] };

    if (!Array.isArray(result.embeddings) || result.embeddings.length !== batch.length) {
      throw new EmbeddingError("Invalid embedding response payload");
    }

    return result.embeddings;
  }
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const providerConfig: EmbeddingProviderConfig = {
    provider: config.EMBEDDING_PROVIDER,
    model: config.EMBEDDING_MODEL,
    baseUrl: config.EMBEDDING_BASE_URL,
    apiKey: config.EMBEDDING_API_KEY,
    maxBatchSize: config.EMBEDDING_MAX_BATCH,
    concurrency: config.EMBEDDING_CONCURRENCY,
    timeoutMs: config.EMBEDDING_TIMEOUT_MS,
    maxTokensPerInput: config.EMBEDDING_MAX_TOKENS_PER_INPUT,
    maxRetries: config.EMBEDDING_MAX_RETRIES,
  };

  switch (config.EMBEDDING_PROVIDER) {
    case "self_hosted":
      return new SelfHostedEmbeddingProvider(providerConfig, providerConfig);
    case "openai":
      return new OpenAIEmbeddingProvider(providerConfig, providerConfig);
    default:
      throw new Error(`Embedding provider ${config.EMBEDDING_PROVIDER} is not supported yet`);
  }
}
