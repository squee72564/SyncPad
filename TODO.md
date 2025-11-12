# SyncPad TODO

## Backend
- [done] Implement foundational `v1/workspaces` CRUD routes that load context via `attachWorkspaceContext` and enforce `requireWorkspaceRole` / `requireWorkspacePermission`. Follow up with routes for members, invites, documents, comments, share links, and AI jobs.
- [done] Add document validations, types, services, controller, and `v1/workspaces/:workspaceId/documents` routes with workspace-aware permissions, slug uniqueness handling, and publish guards.
- Add controllers/services that mirror the remaining Prisma schema (member role changes, invite acceptance, comment resolution, AI job queue operations). Workspace & document scaffolding now exist—extend it for additional resources.
- [done] Extend Zod request validation using `workspaceValidations` helpers so every workspace-scoped route validates `workspaceId` + payload shape before hitting controllers.
- [done] Add workspace invite functionality based on the `WorkspaceInvite` table in `backend/prisma/schema.prisma`. Workspace invitations are now managed at `/v1/workspaces/:workspaceId/invites` (list/create/resend/revoke) plus `/v1/workspaces/invites/:token/accept`, enforcing `member:invite`, token expiry, duplicate checks, and membership creation on acceptance.
- [done] Wire email delivery + frontend UX for invites (Resend-backed email queue with dev logging, dashboard invite composer/list with copyable links, and `/invites/:token` acceptance flow that handles login/signup redirects).
- [done] Implement document share link APIs under `/v1/workspaces/:workspaceId/documents/:documentId/share-links` (list/create/update/delete) plus `/v1/share-links/:token` preview, with dedicated controllers/services/validators and route tests.
- Cover the workspace/document middleware, validators, and service flows with Vitest + Supertest (membership, share links, permission failures, happy paths).
- Seed or fixture sample workspace data to accelerate local testing and future Playwright flows.


## Frontend
- [in-progress] Replace dashboard placeholders with API-driven data once backend routes are ready (documents now integrate with the API; members + invites are live, AI views still pending).
- [done] Introduce a workspace selector/context provider so dashboard pages query the active workspace consistently.
- Begin prototyping the collaborative editor UI (CRDT integration, comment threads, presence indicators) and associated panels.
- Tighten invite UX polish: add share-link management, invite previews for logged-out users, Copy-to-clipboard hints, and broaden dashboard tests around invite flows.
- Expand component tests to cover new dashboard screens and stateful hooks as they ship.

## Infrastructure & QE
- Stand up Playwright (or similar) in `tests/e2e` once auth + workspace flows are stable; wire to a seeded local environment.
- Define background worker infrastructure for AI jobs (queue, worker process, error handling) even if the first iteration is a stub.
- Document deployment guidelines for local Docker Compose and outline the path to AWS CDK/Terraform-based environments.
