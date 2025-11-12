# SyncPad

SyncPad is an emerging collaborative knowledge base that blends team wikis with AI-assisted insights. The goal is to let distributed teams write, share, and search workspaces together while large-language-model helpers summarize content, answer questions, and spotlight the right information at the right time.

## Product Vision
- **Shared Workspace**: Teams draft and organize documents together, with hierarchical collections for projects, specs, and meeting notes.
- **AI-Augmented Knowledge**: Summaries, semantic search, and contextual Q&A pull from synced document embeddings stored in a vector database.
- **Realtime Collaboration**: Concurrent editing powered by WebSockets and CRDT/pub-sub primitives keeps every client in sync without conflict.
- **Cloud-Ready Foundation**: Early development runs locally via Docker Compose, with abstractions that let us swap in managed services and IaC (AWS CDK, Terraform) as the platform matures.

## Current Architecture (In Progress)
- **Frontend**: Next.js 15 (React 19) application in `frontend/` with a refreshed landing page, auth flows, dashboard shells, and Vitest/Testing Library coverage.
- **Backend**: Express 5 TypeScript service in `backend/` handling REST APIs, auth, workspace-aware middleware, rate limiting, logging, and Prisma integration.
- **Documents, Invites & Share Links**: Workspace-scoped document CRUD lives under `v1/workspaces/:workspaceId/documents`, workspace invites under `/v1/workspaces/:workspaceId/invites` (list/create/resend/revoke) plus `/v1/workspaces/invites/:token/accept`, and document share links under `/v1/workspaces/:workspaceId/documents/:documentId/share-links` (list/create/update/delete) with token preview at `/v1/share-links/:token`.
- **Dashboard UX**: Next.js dashboard now includes a workspace switcher, API-backed document listings (all, drafts, published), invite management (composer, pending list, copy/resend/revoke actions), and forms for creating/updating document metadata. Public invite acceptance lives under `/invites/:token` with auth-aware redirects.
- **Data Layer**: PostgreSQL via Prisma ORM. The schema now models workspaces, membership roles, documents, revisions, comments, share links, embeddings, activity logs, and AI jobs. The roadmap still includes a vector store (pgvector, Pinecone, etc.) for retrieval-augmented generation.
- **Gateway & Integration**: API gateway layer to broker frontend requests, enforce rate limiting, and host future service-to-service calls.
- **Collaboration Stack**: Planned WebSocket broker with CRDT-powered document state and optional pub/sub bridge for horizontal scaling.

## Core Use Cases & Feature Ideas
- **Document Lifecycle**: Create, version, and archive pages with role-based access and granular sharing links.
- **Workspace Search**: Hybrid keyword + vector retrieval surfaces relevant docs, snippets, and AI-generated summaries.
- **Meeting Recaps**: Upload transcripts or notes to generate action-item summaries and embed knowledge in the workspace.
- **Contextual Q&A**: Ask natural-language questions and receive answers grounded in workspace content.
- **Presence & Comments**: Typing indicators, inline comments, and mention notifications keep teams aligned.
- **Template Library**: Prebuilt templates for product specs, incident reviews, and onboarding guides.
- **Automation Hooks**: Outbound webhooks and task integrations (Jira, Slack, Linear) triggered by doc updates.

## Development Checklist
- [x] Define workspace data model (users, teams, permissions, documents, revisions, embeddings).
- [x] Stand up auth flows (email/password, OAuth providers, session management, RBAC via better-auth).
- [x] Introduce workspace-aware middleware and validation helpers for request handling.
- [ ] Implement collaborative document editor with CRDT state propagation and optimistic UI updates.
- [ ] Wire document storage + version history via Prisma/PostgreSQL.
- [ ] Introduce background job pipeline for embedding generation and vector upserts.
- [ ] Add semantic search endpoints and AI assistant orchestration (RAG, prompt templates, rate limiting).
- [ ] Harden API gateway with monitoring, structured logging, and pagination standards.
- [ ] Build responsive UI shell, document browsing, invite management polish (share links, invite previews), and editor experience in Next.js.
- [ ] Instrument backend/frontend with Vitest suites; plan Playwright E2E coverage.
- [ ] Containerize services and define Docker Compose workflows; outline future IaC (AWS CDK) module boundaries.

## Roadmap Snapshot
1. **MVP Foundations**: Authenticated workspaces, workspace-level RBAC, basic document CRUD, markdown editor, and PostgreSQL persistence.
2. **Collaboration Layer**: Realtime presence, conflict-free editing, commenting, and activity feeds.
3. **Intelligence Layer**: Embed pipeline, AI-assisted summaries, semantic search, and contextual assistants.
4. **Scalability & Reliability**: API gateway hardening, background workers, observability, rate limiting, and zero-downtime deploys.
5. **Cloud Native Expansion**: Abstract storage, queueing, and inference providers; introduce IaC with AWS CDK/Terraform, multi-tenant controls, and managed secrets.

## Getting Started (WIP)
- Install pnpm and run `pnpm install` at the repo root to sync dependencies for both workspaces.
- Use `pnpm --filter ./backend start:dev` and `pnpm --filter ./frontend dev` to launch the API + Next.js app locally.
- Copy `.env.development` templates and bring up Docker Compose for local PostgreSQL.
- Check `AGENTS.md` for contributor guidelines, testing strategy, and tooling notes.

Contributions are welcome—open an issue or start a discussion to suggest platform capabilities, AI workflows, or integration ideas.
