import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConfig = {
  EMBEDDING_PROVIDER: "openai",
  EMBEDDING_MODEL: "test-model",
  EMBEDDING_BASE_URL: "https://example.com",
  EMBEDDING_API_KEY: "test-key",
  EMBEDDING_TIMEOUT_MS: 1000,
  EMBEDDING_MAX_BATCH: 2,
  EMBEDDING_CONCURRENCY: 2,
  EMBEDDING_MAX_TOKENS_PER_INPUT: 50,
  EMBEDDING_MAX_RETRIES: 3,
  EMBEDDING_CHUNK_TARGET_TOKENS: 100,
  EMBEDDING_CHUNK_MIN_TOKENS: 20,
  EMBEDDING_CHUNK_OVERLAP_TOKENS: 10,
  EMBEDDING_CHUNK_AVG_CHARS_PER_TOKEN: 2,
} as Record<string, unknown>;

vi.mock("@/config/config.ts", () => ({
  __esModule: true,
  default: mockConfig,
}));

vi.mock("@/config/logger.ts", () => ({
  __esModule: true,
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const { createEmbeddingProvider } = await import("@/embed.ts");

const resetConfig = (overrides: Record<string, unknown> = {}) => {
  Object.assign(mockConfig, {
    EMBEDDING_PROVIDER: "openai",
    EMBEDDING_MODEL: "test-model",
    EMBEDDING_BASE_URL: "https://example.com",
    EMBEDDING_API_KEY: "test-key",
    EMBEDDING_TIMEOUT_MS: 1000,
    EMBEDDING_MAX_BATCH: 2,
    EMBEDDING_CONCURRENCY: 2,
    EMBEDDING_MAX_TOKENS_PER_INPUT: 50,
    EMBEDDING_MAX_RETRIES: 3,
    EMBEDDING_CHUNK_TARGET_TOKENS: 100,
    EMBEDDING_CHUNK_MIN_TOKENS: 20,
    EMBEDDING_CHUNK_OVERLAP_TOKENS: 10,
    EMBEDDING_CHUNK_AVG_CHARS_PER_TOKEN: 2,
    ...overrides,
  });
};

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

describe("createEmbeddingProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetConfig();
    global.fetch = vi.fn();
  });

  it("batches requests and preserves order for OpenAI provider", async () => {
    let batchIndex = 0;
    (global.fetch as FetchMock).mockImplementation(
      async (_url, options: RequestInit | undefined) => {
        const body = JSON.parse(options?.body?.toString() ?? "{}");
        const inputs: string[] = body.input;
        const offset = batchIndex * 10;
        batchIndex += 1;
        return {
          ok: true,
          json: async () => ({
            data: inputs.map((_, idx) => ({ embedding: [offset + idx] })),
          }),
        } as Response;
      }
    );

    const provider = createEmbeddingProvider();
    const texts = ["one", "two", "three", "four"];
    const embeddings = await provider.generateEmbeddings(texts);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(embeddings).toEqual([[0], [1], [10], [11]]);
  });

  it("retries transient errors before succeeding", async () => {
    vi.useFakeTimers();
    (global.fetch as FetchMock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "fail",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ embedding: [42] }] }),
      } as Response);

    const provider = createEmbeddingProvider();
    const promise = provider.generateEmbeddings(["retry"]);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual([[42]]);
    vi.useRealTimers();
  });

  it("throws when text exceeds token limit", async () => {
    resetConfig({ EMBEDDING_MAX_TOKENS_PER_INPUT: 1, EMBEDDING_CHUNK_AVG_CHARS_PER_TOKEN: 1 });
    const provider = createEmbeddingProvider();
    await expect(provider.generateEmbeddings(["toolong"])).rejects.toThrow(
      /Input exceeds maximum tokens/
    );
  });

  it("sends requests to self-hosted provider and enforces payload shape", async () => {
    resetConfig({
      EMBEDDING_PROVIDER: "self_hosted",
      EMBEDDING_BASE_URL: "https://selfhosted.local/embed",
    });

    (global.fetch as FetchMock).mockResolvedValue({
      ok: true,
      json: async () => ({ embeddings: [[1], [2]] }),
    } as Response);

    const provider = createEmbeddingProvider();
    const result = await provider.generateEmbeddings(["a", "b"]);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://selfhosted.local/embed",
      expect.objectContaining({
        body: JSON.stringify({ inputs: ["a", "b"], model: "test-model" }),
      })
    );
    expect(result).toEqual([[1], [2]]);
  });

  it("requires API key for OpenAI provider", async () => {
    resetConfig({ EMBEDDING_API_KEY: undefined });
    const provider = createEmbeddingProvider();
    await expect(provider.generateEmbeddings(["a"])).rejects.toThrow(
      "OpenAI API key is not configured"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
