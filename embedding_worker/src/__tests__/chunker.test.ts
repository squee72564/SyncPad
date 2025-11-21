import { describe, expect, it } from "vitest";
import DocumentChunker from "@/chunker.ts";

const createChunker = (overrides: ConstructorParameters<typeof DocumentChunker>[0] = {}) =>
  new DocumentChunker({
    targetTokens: 50,
    overlapTokens: 10,
    minTokens: 5,
    averageCharsPerToken: 1,
    ...overrides,
  });

describe("DocumentChunker", () => {
  it("returns empty array for blank or whitespace-only content", () => {
    const chunker = createChunker();

    expect(chunker.chunkDocument("")).toEqual([]);
    expect(chunker.chunkDocument("   \n\n\t")).toEqual([]);
  });

  it("normalizes whitespace and preserves paragraph breaks", () => {
    const chunker = createChunker({ targetTokens: 500 });
    const raw =
      "Hello,\tworld!  This  is a test.\r\n\r\nSecond\tparagraph with   extra spaces.\u0000";

    const chunks = chunker.chunkDocument(raw);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Hello, world! This is a test.\n\nSecond paragraph with extra spaces.");
  });

  it("splits content into multiple chunks when exceeding target length", () => {
    const chunker = createChunker({ targetTokens: 20, overlapTokens: 0, minTokens: 5 });
    const text = "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu";

    const chunks = chunker.chunkDocument(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(20);
    }
    expect(chunks.join(" ").includes("alpha")).toBe(true);
    expect(chunks.join(" ").includes("nu")).toBe(true);
  });

  it("forces split for segments without whitespace", () => {
    const chunker = createChunker({ targetTokens: 10, overlapTokens: 0, minTokens: 5 });
    const longWord = "x".repeat(60);

    const chunks = chunker.chunkDocument(longWord);

    expect(chunks.length).toBeGreaterThan(1);
    const processed = chunks.map((chunk) => chunk.replace(/\s+/g, ""));
    const overlapChars = (chunker as unknown as { overlapChars?: number }).overlapChars ?? 0;

    for (const chunk of processed) {
      expect(chunk.length).toBeLessThanOrEqual(10 + overlapChars);
    }

    let rebuilt = processed[0] ?? "";
    for (let i = 1; i < processed.length; i++) {
      rebuilt += processed[i]!.slice(overlapChars);
    }

    expect(rebuilt).toBe(longWord);
  });

  it("applies overlap between chunks when configured", () => {
    const chunker = createChunker({ targetTokens: 20, overlapTokens: 5, minTokens: 5 });
    const payload = "12345678901234567890123456789012345678901234567890";

    const chunks = chunker.chunkDocument(payload);

    expect(chunks.length).toBeGreaterThan(1);
    const [first, second] = chunks;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first?.length).toBeLessThanOrEqual(20);
    expect(second?.startsWith(`${first?.slice(-5)} `)).toBe(true);
  });

  it("inserts paragraph breaks between chunks originating from different paragraphs", () => {
    const chunker = createChunker({ targetTokens: 500 });
    const content = "First paragraph one.\n\nSecond paragraph two.";

    const chunks = chunker.chunkDocument(content);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("\n\n");
    expect(chunks).toBeDefined();
    const [firstParagraph, secondParagraph] = (chunks[0] as string).split("\n\n");
    expect(firstParagraph).toBeDefined();
    expect(secondParagraph).toBeDefined();
    expect(firstParagraph).toBe("First paragraph one.");
    expect(secondParagraph).toBe("Second paragraph two.");
  });
});
