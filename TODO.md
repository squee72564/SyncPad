# SyncPad TODO

## Backend
- [done] Implement foundational `v1/workspaces` CRUD routes that load context via `attachWorkspaceContext` and enforce `requireWorkspaceRole` / `requireWorkspacePermission`. Follow up with routes for members, invites, documents, comments, share links, and AI jobs.
- [done] Add document validations, types, services, controller, and `v1/workspaces/:workspaceId/documents` routes with workspace-aware permissions, slug uniqueness handling, and publish guards.
- Add controllers/services that mirror the remaining Prisma schema (member role changes, invite acceptance, comment resolution, AI job queue operations). Workspace & document scaffolding now exist—extend it for additional resources.
- [done] Wire activity-log creation into workspace, document, and share-link controllers so backend actions automatically record auditable events.
- [done] Extend Zod request validation using `workspaceValidations` helpers so every workspace-scoped route validates `workspaceId` + payload shape before hitting controllers.
- [done] Add workspace invite functionality based on the `WorkspaceInvite` table in `backend/prisma/schema.prisma`. Workspace invitations are now managed at `/v1/workspaces/:workspaceId/invites` (list/create/resend/revoke) plus `/v1/workspaces/invites/:token/accept`, enforcing `member:invite`, token expiry, duplicate checks, and membership creation on acceptance.
- [done] Wire email delivery + frontend UX for invites (Resend-backed email queue with dev logging, dashboard invite composer/list with copyable links, and `/invites/:token` acceptance flow that handles login/signup redirects).
- [done] Implement document share link APIs under `/v1/workspaces/:workspaceId/documents/:documentId/share-links` (list/create/update/delete) plus `/v1/share-links/:token` preview, with dedicated controllers/services/validators and route tests.
- [done] Add workspace activity log API for creating and deleting logs via `/v1/workspaces/:workspaceId/activity-logs`, wiring controllers, services, validators, and route tests.
- [ ] Research Embedding models that can be used to create vectorized embeddings for documents
- [ ] Implement service / endpoint for embedding model
- [ ] Implement Tier 1 AI jobs: `EMBED_DOCUMENT` vector generation on document changes, `SUMMARIZE_DOCUMENT` / `WORKSPACE_DIGEST` summarization, and `DRAFT_OUTLINE` assistance with persisted results.
- [ ] Prototype Tier 2 AI collaborators: tracked-change `COLLAB_EDIT` suggestions, `INSIGHT_GENERATOR` risk cards tied to document publishing, and comment summarization/resolution jobs.
- [ ] Design Tier 3 autonomous flows: multi-agent `COAUTHOR_ROOM`, decision graph extraction (`DECISION_TIMELINE`), and recurring `IDEATION_SPRINT` jobs that orchestrate follow-up tasks.
- [ ] Enforce document status semantics: define read/update/comment rules for DRAFT, IN_REVIEW, PUBLISHED, and ARCHIVED documents based on workspace roles (OWNER/ADMIN/EDITOR/COMMENTER/VIEWER) and update middleware/share-link logic accordingly.

### Document Status Semantics (authoritative outline)

- DRAFT
  - Visibility: OWNER, ADMIN, EDITOR. COMMENTER optionally via explicit invite; VIEWER no access by default.
  - Editing: OWNER/ADMIN/EDITOR can edit; COMMENTER may comment only if explicitly allowed; VIEWER none.
  - Share links: Disabled by default (no public access). Overrides require explicit allow and remain comment-only at most.

- IN_REVIEW
  - Visibility: All roles with `document:read` (OWNER/ADMIN/EDITOR/COMMENTER/VIEWER).
  - Editing: OWNER/ADMIN can edit; EDITOR can propose changes or edit within policy; COMMENTER can comment; VIEWER view-only.
  - Share links: Allowed but default to comment-only. External reviewers can comment; no edit tokens.
  - Transitions: Publish requires `document:publish` (typically OWNER/ADMIN; EDITOR if granted).

- PUBLISHED
  - Visibility: All roles with `document:read`.
  - Editing: OWNER/ADMIN can edit/manage; EDITOR can edit with `document:update`; COMMENTER comment-only; VIEWER view-only.
  - Share links: Default read-only. Edit-capable links require explicit permission and should be rare.
  - Downstream: Triggers embeddings regeneration, activity announcements, and digest jobs.

- ARCHIVED
  - Visibility: Hidden from default lists; accessible to OWNER/ADMIN and others only via explicit request.
  - Editing: Disabled. Unarchive required to modify (returns to DRAFT/IN_REVIEW). EDITOR/COMMENTER view-only; VIEWER typically no access.
  - Share links: New links blocked; existing links revoked or forced read-only with warning.

Implementation notes
- Add middleware `requireDocumentStatusAccess` combining `req.workspaceContext.effectiveRole` + document.status to guard read/update/comment routes.
- Adjust share-link creation/update rules per status (block for DRAFT/ARCHIVED; comment-only for IN_REVIEW; read-only default for PUBLISHED).
- Surface status-aware UI cues (read-only banners, disabled editors) and emit activity logs on status transitions.
- Cover the workspace/document middleware, validators, and service flows with Vitest + Supertest (membership, share links, permission failures, happy paths).
- Seed or fixture sample workspace data to accelerate local testing and future Playwright flows.


## Frontend
- [in-progress] Replace dashboard placeholders with API-driven data once backend routes are ready (documents now integrate with the API; members + invites are live, AI views still pending).
- [done] Build the `/dashboard/activity` timeline UI powered by the GET `/v1/workspaces/:workspaceId/activity-logs` endpoint, including log deletion and empty/error states.
- [done] Introduce a workspace selector/context provider so dashboard pages query the active workspace consistently.
- [done] Integrate a TipTap-based editor for DRAFT documents with autosave to `DocumentCollabState`; next, layer CRDT/WebSocket syncing plus commenting/presence.
- [ ] Surface AI job results: build `/dashboard/ai/jobs` list views, outline suggestion panels, digest cards, and tracked-change review UI for Tier 1+2 workflows.
- [done] Tighten invite/share-link UX: add dashboard share-link management (document picker, creator form, copy/regenerate/revoke), invite previews for logged-out users, copy-to-clipboard hints, and broaden dashboard tests around invite/share flows.
- Expand component tests to cover new dashboard screens and stateful hooks as they ship.

## Infrastructure & QE
- Stand up Playwright (or similar) in `tests/e2e` once auth + workspace flows are stable; wire to a seeded local environment.
- Define background worker infrastructure for AI jobs (queue, worker process, error handling) even if the first iteration is a stub, then extend it with scheduling/retry logic for tiered workloads.
- Document deployment guidelines for local Docker Compose and outline the path to AWS CDK/Terraform-based environments.
