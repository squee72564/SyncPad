# SyncPad TODO

## Backend
- [done] Implement foundational `v1/workspaces` CRUD routes that load context via `attachWorkspaceContext` and enforce `requireWorkspaceRole` / `requireWorkspacePermission`. Follow up with routes for members, invites, documents, comments, share links, and AI jobs.
- Add controllers/services that mirror the new Prisma schema (member role changes, invite acceptance, document hierarchy management, comment resolution, AI job queue operations). Workspace controller/service scaffolding now exists—extend it for the remaining resources.
- [done] Extend Zod request validation using `workspaceValidations` helpers so every workspace-scoped route validates `workspaceId` + payload shape before hitting controllers.
- Cover the workspace middleware and validators with Vitest + Supertest (membership, share links, permission failures, happy paths).
- Seed or fixture sample workspace data to accelerate local testing and future Playwright flows.

## Frontend
- Replace dashboard placeholders with API-driven data once backend routes are ready (members list, invites, document collections, AI job queue, etc.).
- Introduce a workspace selector/context provider so dashboard pages query the active workspace consistently.
- Begin prototyping the collaborative editor UI (CRDT integration, comment threads, presence indicators) and associated panels.
- Expand component tests to cover new dashboard screens and stateful hooks as they ship.

## Infrastructure & QE
- Stand up Playwright (or similar) in `tests/e2e` once auth + workspace flows are stable; wire to a seeded local environment.
- Define background worker infrastructure for AI jobs (queue, worker process, error handling) even if the first iteration is a stub.
- Document deployment guidelines for local Docker Compose and outline the path to AWS CDK/Terraform-based environments.
