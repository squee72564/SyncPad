# SyncPad TODO

## Backend
- [done] Implement foundational `v1/workspaces` CRUD routes that load context via `attachWorkspaceContext` and enforce `requireWorkspaceRole` / `requireWorkspacePermission`. Follow up with routes for members, invites, documents, comments, share links, and AI jobs.
- [done] Add document validations, types, services, controller, and `v1/workspaces/:workspaceId/documents` routes with workspace-aware permissions, slug uniqueness handling, and publish guards.
- Add controllers/services that mirror the remaining Prisma schema (member role changes, invite acceptance, comment resolution, AI job queue operations). Workspace & document scaffolding now exist—extend it for additional resources.
- [done] Extend Zod request validation using `workspaceValidations` helpers so every workspace-scoped route validates `workspaceId` + payload shape before hitting controllers.
- Cover the workspace/document middleware, validators, and service flows with Vitest + Supertest (membership, share links, permission failures, happy paths).
- Seed or fixture sample workspace data to accelerate local testing and future Playwright flows.

## Frontend
- [in-progress] Replace dashboard placeholders with API-driven data once backend routes are ready (documents now integrate with the API; members, invites, and AI views still pending).
- [done] Introduce a workspace selector/context provider so dashboard pages query the active workspace consistently.
- Begin prototyping the collaborative editor UI (CRDT integration, comment threads, presence indicators) and associated panels.
- Expand component tests to cover new dashboard screens and stateful hooks as they ship.

## Infrastructure & QE
- Stand up Playwright (or similar) in `tests/e2e` once auth + workspace flows are stable; wire to a seeded local environment.
- Define background worker infrastructure for AI jobs (queue, worker process, error handling) even if the first iteration is a stub.
- Document deployment guidelines for local Docker Compose and outline the path to AWS CDK/Terraform-based environments.
