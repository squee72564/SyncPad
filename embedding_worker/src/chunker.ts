export default class DocumentChunker {
  constructor() {}

  chunkDocument(content: string): string[] {
    // First sanitize content
    const sanitizedContent = content.replace(/\s+/g, " ").trim();

    // Simple chunking logic: split by sentences and group into chunks of ~500 characters
    const sentences = sanitizedContent.match(/[^\.!\?]+[\.!\?]+/g) || [];
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= 500) {
        currentChunk += sentence + " ";
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence + " ";
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
