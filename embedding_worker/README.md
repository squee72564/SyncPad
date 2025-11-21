# Embedding Worker

The embedding worker ingests document jobs from Redis Streams, chunks document content, generates vector embeddings with a pluggable provider, and upserts the vectors into PostgreSQL for RAG/search. It runs as a standalone Node/TS service built with tsup.

## Directory Layout

- `src/config/` – Zod-powered env parsing (`config.ts`) plus logger config. Exposes all chunking/provider/Redis settings.
- `src/lib/` – Shared helpers (`prisma.ts` client wrapper, `redisClient.ts` factory with reconnect strategy).
- `src/services/`
  - `document.service.ts` – Fetch document content (id + content) via Prisma.
  - `documentEmbedding.service.ts` – Transactionally replace/delete embeddings directly against the `document_embedding` table.
- `src/controllers/`
  - `document.controller.ts` – Thin wrapper around `documentService.getById`.
  - `documentEmbedding.controller.ts` – Validates chunk payloads, converts numeric arrays to pgvector strings, and calls the service layer.
- `src/chunker.ts` – Paragraph/sentence-aware chunker with configurable token targets, overlap, and forced splits for long paragraphs.
- `src/embed.ts` – Embedding provider framework with batching, concurrency limiting, retries, timeout-aware fetch, and concrete providers (OpenAI + generic self-hosted).
- `src/queue.ts` – Redis Streams abstraction for the embedding job stream (XADD/XREADGROUP/XACK/claim/dead-letter).
- `src/worker.ts` – `EmbeddingWorker` class handling lifecycle, signal-aware shutdown, message processing, and cleanup.
- `src/index.ts` – Entrypoint that instantiates dependencies, starts the worker, and registers signal/exception handlers.

## Configuration

`src/config/config.ts` exposes everything needed for local/prod runs:

- Redis: `REDIS_URL`, `REDIS_STREAM_KEY`, `REDIS_CONSUMER_GROUP`.
- Chunking: `EMBEDDING_CHUNK_*` tokens + chars per token.
- Provider: `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, `EMBEDDING_BASE_URL`, `EMBEDDING_API_KEY`, timeouts, max batch size, concurrency, retries, and token limits.

Place `.env.development` / `.env.production` files in the repo root and populate the required variables before running `pnpm --filter ./embedding_worker start:dev`.

## Flow

1. Backend enqueues an `EMBED_DOCUMENT` job (workspaceId/documentId[/revisionId]) into the Redis stream.
2. Worker boots, reclaims pending jobs, and waits on `XREADGROUP`.
3. For each message:
   - Fetch document content via Prisma.
   - Chunk text using `DocumentChunker`.
   - Batch-call the configured embedding provider with concurrency/retry guards.
   - Persist all chunk embeddings transactionally (delete + insert) via the controller/service layer.
   - `XACK` on success or `sendToDeadLetter` on failure.
4. On SIGINT/SIGTERM/uncaught errors, the worker stops the loop, flushes outstanding work, disconnects from Prisma/Redis, and exits cleanly.

Use `pnpm --filter ./embedding_worker build` to emit the production bundle (`dist/`). The worker is stateless aside from Redis streams and PostgreSQL, so multiple instances can run for throughput.
