import config from "@/config/config.ts";

type DocumentChunkerOptions = {
  /**
   * Approximate maximum tokens per chunk (converted to characters using the average token size).
   * Defaults to 800 tokens which roughly maps to ~3200 characters.
   */
  targetTokens?: number;
  /**
   * How many tokens of overlap to include between chunks. Defaults to 200 tokens (~800 characters).
   */
  overlapTokens?: number;
  /**
   * Minimum number of tokens before we consider a chunk valid. Defaults to 200 tokens.
   * This primarily prevents emitting lots of tiny chunks when documents contain short paragraphs.
   */
  minTokens?: number;
  /**
   * Approximate number of characters per token. OpenAI-style tokenizers average ~4 chars/token.
   */
  averageCharsPerToken?: number;
};

const PARAGRAPH_BREAK = "\n\n";

const DEFAULT_OPTIONS: Required<DocumentChunkerOptions> = {
  targetTokens: config.EMBEDDING_CHUNK_TARGET_TOKENS,
  overlapTokens: config.EMBEDDING_CHUNK_OVERLAP_TOKENS,
  minTokens: config.EMBEDDING_CHUNK_MIN_TOKENS,
  averageCharsPerToken: config.EMBEDDING_CHUNK_AVG_CHARS_PER_TOKEN,
};

export default class DocumentChunker {
  private readonly maxChunkChars: number;
  private readonly overlapChars: number;
  private readonly minChunkChars: number;
  private readonly averageCharsPerToken: number;

  constructor(options: DocumentChunkerOptions = {}) {
    const merged = { ...DEFAULT_OPTIONS, ...options };
    this.averageCharsPerToken = merged.averageCharsPerToken;
    this.maxChunkChars = this.tokensToChars(merged.targetTokens);
    this.overlapChars = this.tokensToChars(merged.overlapTokens);
    this.minChunkChars = this.tokensToChars(merged.minTokens);
  }

  chunkDocument(content: string): string[] {
    const normalized = this.normalizeContent(content);
    if (!normalized) {
      return [];
    }

    const segments = this.createSegments(normalized);
    if (!segments.length) {
      return [];
    }

    return this.buildChunks(segments);
  }

  private normalizeContent(content: string): string {
    return (
      content
        // Normalize Windows line endings and strip null chars
        .replace(/\r\n/g, "\n")
        .replace(/\u0000/g, "")
        // Normalize tabs and repeated spaces but keep paragraph/newline boundaries
        .replace(/\t+/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .trim()
    );
  }

  private createSegments(content: string): string[] {
    const paragraphs = content.split(/\n{2,}/).map((paragraph) => paragraph.trim());
    const segments: string[] = [];

    for (let index = 0; index < paragraphs.length; index++) {
      const paragraph = paragraphs[index];

      if (!paragraph) {
        continue;
      }

      const sentences = this.splitIntoSentences(paragraph);

      if (sentences.length === 0) {
        segments.push(paragraph);
      } else {
        segments.push(...sentences);
      }

      if (index < paragraphs.length - 1) {
        segments.push(PARAGRAPH_BREAK);
      }
    }

    return segments;
  }

  private splitIntoSentences(paragraph: string): string[] {
    const matches = paragraph.match(/[^.!?]+(?:[.!?]+|$)/g);
    if (!matches) {
      return [];
    }

    return matches.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 0);
  }

  private buildChunks(segments: string[]): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    for (const segment of segments) {
      const pieces = this.splitSegmentIfNeeded(segment);

      for (const piece of pieces) {
        currentChunk = this.appendPiece(currentChunk, piece, chunks);
      }
    }

    const finalChunk = currentChunk.trim();
    if (finalChunk.length > 0) {
      chunks.push(finalChunk);
    }

    return chunks;
  }

  private appendPiece(currentChunk: string, piece: string, chunks: string[]): string {
    if (!piece) {
      return currentChunk;
    }

    if (piece === PARAGRAPH_BREAK && currentChunk.length === 0) {
      return currentChunk;
    }

    let nextChunk = this.joinChunk(currentChunk, piece);

    const exceedsMax =
      currentChunk.length > 0 && this.countCharacters(nextChunk) > this.maxChunkChars;

    if (exceedsMax) {
      const trimmedChunk = currentChunk.trim();
      if (trimmedChunk.length > 0) {
        chunks.push(trimmedChunk);
      }

      const overlap = this.getOverlapTail(trimmedChunk);
      nextChunk = overlap ? this.joinChunk(overlap, piece) : piece === PARAGRAPH_BREAK ? "" : piece;
    }

    return nextChunk;
  }

  private splitSegmentIfNeeded(segment: string): string[] {
    if (segment === PARAGRAPH_BREAK) {
      return [segment];
    }

    const trimmed = segment.trim();
    if (!trimmed) {
      return [];
    }

    if (this.countCharacters(trimmed) <= this.maxChunkChars) {
      return [trimmed];
    }

    return this.forceSplit(trimmed);
  }

  private forceSplit(text: string): string[] {
    const parts: string[] = [];
    let remaining = text;

    while (this.countCharacters(remaining) > this.maxChunkChars) {
      const slice = remaining.slice(0, this.maxChunkChars);
      const breakpoint = this.findSplitPoint(slice);
      const head = remaining.slice(0, breakpoint).trim();

      if (head.length > 0) {
        parts.push(head);
      }

      remaining = remaining.slice(breakpoint).trim();
    }

    if (remaining.length > 0) {
      parts.push(remaining);
    }

    return parts;
  }

  private findSplitPoint(text: string): number {
    const lastWhitespace = text.lastIndexOf(" ");
    if (lastWhitespace === -1 || lastWhitespace < this.minChunkChars) {
      return Math.min(text.length, this.maxChunkChars);
    }

    return lastWhitespace;
  }

  private getOverlapTail(chunk: string): string {
    if (!this.overlapChars) {
      return "";
    }

    const normalized = chunk.trim();
    if (!normalized.length) {
      return "";
    }

    if (normalized.length <= this.overlapChars) {
      return normalized;
    }

    const start = normalized.length - this.overlapChars;
    const overlap = normalized.slice(start);
    const boundary = overlap.indexOf(" ");

    if (boundary === -1) {
      return overlap;
    }

    return overlap.slice(boundary + 1);
  }

  private joinChunk(existing: string, addition: string): string {
    if (!addition) {
      return existing;
    }

    if (!existing.length) {
      return addition === PARAGRAPH_BREAK ? "" : addition;
    }

    if (addition === PARAGRAPH_BREAK) {
      return existing.endsWith(PARAGRAPH_BREAK) ? existing : `${existing}${PARAGRAPH_BREAK}`;
    }

    if (existing.endsWith(PARAGRAPH_BREAK)) {
      return `${existing}${addition}`;
    }

    return `${existing} ${addition}`;
  }

  private countCharacters(text: string): number {
    return text.length;
  }

  private tokensToChars(tokens: number): number {
    return Math.max(1, Math.round(tokens * this.averageCharsPerToken));
  }
}
