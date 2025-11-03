# Repository Guidelines

## Project Structure & Module Organization
This pnpm-managed repo contains a backend API and a Next.js frontend. Work inside the module-specific directories and leave generated bundles in `backend/dist` untouched.
- `./backend`: Express 5 TypeScript app with:
    - `./backend/src/config`: Environment variable validation with zod schema, morgan and winston configuration
    - `./backend/src/controllers`: High level business logic for routes utilizing established services; after validation/auth/permission middlewares have successfully ran
    - `./backend/src/lib`: Better auth config, Better Auth admin plugin for roles and permissions (basic RBAC), prisma client file
    - `./backend/src/middleware`: Various middlewares for express application and routes. Notable middlewares are auth.ts (user session authentication), validate.ts (zod schema based request validation), workspace.ts (attach workspace context, validate workspace roles and permissions for fine grained access control)
    - `./backend/routes/v1`: Express routes utilizing middlewares and exposing RESTful API for data interaction; index.ts sets up route paths with exported express routers
    - `./backend/src/services`: Files exporting functions to interact with database and other resources at a granular level
    - `./backend/src/types`: Types relating to Request types for routes inferred from Zod schemas for requests; other type extensions for Express Request type
    - `./backend/src/utils`: Helper utility functions like CatchAsync, pick, custom ApiError class for consistent error handling, and ZodRequest to extend Express Request types with zod schemas for required request shape
    - `./backend/src/validations`: Zod Schemas defining expected request shape for routes
- `backend/prisma`: Prisma schema and migrations; run database tweaks here before committing API changes.

- `frontend/app`: Next.js 15 route segments; shared UI lives in `frontend/components`, hooks in `frontend/hooks`, and typed helpers in `frontend/lib`.
- `frontend/public`: static assets. Config files (`tsconfig*.json`, `eslint.config.*`) sit beside each package, and `node_modules/` is hoisted at the repo root.
- `tests/e2e`: placeholder for upcoming Playwright journeys that stitch backend and frontend together.
- Landing routes (`frontend/app/docs`, `frontend/app/contact`, and new dashboard subdirectories) are placeholders that unblock navigation while UI work continues—keep copy concise when iterating there.

## Build, Test, and Development Commands
Run commands through pnpm to stay inside the correct package context.
- `pnpm --filter ./backend start:dev` runs the Express server with tsx + nodemon for hot reload.
- `pnpm --filter ./backend build` emits compiled JS to `backend/dist` via tsup; run before deploying.
- `pnpm --filter ./backend test` executes Vitest in Node mode; use `test:watch` when iterating and `test:coverage` to emit lcov.
- `pnpm --filter ./frontend dev` launches the Next.js dev server with Turbopack.
- `pnpm --filter ./frontend test` runs Vitest with jsdom + Testing Library for component checks; `test:coverage` mirrors backend reporting.
- `pnpm --filter ./frontend build` creates the production bundle; follow with `pnpm --filter ./frontend start` to preview.
- `pnpm --filter ./backend prisma:migrate:dev` applies migrations using `.env.development`.
- `pnpm --filter ./backend lint:check` and `pnpm --filter ./frontend lint:check` gate linting without auto-fixing; pair with the `pretty:check` scripts when formatting is the only change.

## Coding Style & Naming Conventions
TypeScript is the default language. Prettier (via lint-staged) enforces two-space indentation, double quotes, and trailing commas; run the `pretty` script after sizable refactors. ESLint forbids unused variables unless prefixed with `_`. Backend files stay kebab-case (e.g., `health.route.ts`), and React components use PascalCase default exports. Hooks must start with `use`, and utilities should expose named exports from `lib` folders.

## Authorization & Validation Layers
- Zod Schema based validation for routes in `backend/src/validations`; Use schemas for Request type inference to be as request type in `backend/src/controllers`, and argument type deduction within `backend/src/services`.
    - Reuse workspace context middleware + permission helpers at `backend/src/validations/workspace.validations.ts` (`document:create`, `document:update`, `document:publish`, etc.) when extending this area if applicable.
- Workspace-aware access control lives in `backend/src/middleware/workspace.ts`. Compose `attachWorkspaceContext` after auth and validate middleware to load the current workspace, membership role, and share-link permissions, then guard handlers with `requireWorkspaceRole` or `requireWorkspacePermission`. Leave `workspaceLookup` as `auto` to accept either CUIDs or slugs.
- Prisma schema now models workspaces, membership, documents, revisions, comments, share links, embeddings, activity logs, and AI jobs. Keep migrations additive and coordinate across the team when altering relationships or enums.
- The Next.js dashboard now includes a cookie-backed workspace switcher and API-driven document views (list, drafts, published, create, update). Update workspace selection via the `WorkspaceSwitcher` component (`frontend/app/(validated)/dashboard/workspaces/WorkspaceSwitcher.tsx`) and `setActiveWorkspaceAction` (`frontend/app/(validated)/dashboard/workspaces/actions.ts`).

## Testing Guidelines
Vitest now powers both packages. Use focused unit specs for utilities (`*.spec.ts`) and leave route-level or Prisma-backed flows under `backend/src/__tests__` with Supertest harnesses. Frontend component tests are located in `frontend/__tests__` with `*.test.tsx` files that assert rendered UI via React Testing Library. For integration work, spin up the Express app against a disposable Postgres (Docker compose) and seed via `scripts/seed.ts`; mock external services with `vi.mock`. Plan for Playwright-based end-to-end coverage once auth flows stabilize—capture scenarios under `tests/e2e` and drive them through the combined dev servers. Until CI is wired, attach local `pnpm --filter ... test` output or manual steps to PRs so reviewers understand the verification path.

## Commit & Pull Request Guidelines
Recent commits use short, Title Case subjects (for example, `Add signin/up page`). Keep scope-specific body notes when touching multiple areas. Ensure Husky's pre-commit hook (lint-staged) passes by running the lint and prettier checks before committing. PRs should explain impact, link issues, and include UI screenshots. Flag migrations or environment changes explicitly and request cross-package reviewers when both frontend and backend are touched.

## Environment & Tooling Tips
Copy the appropriate `.env.*` file into each package before running commands; Prisma scripts read `.env.development` by default. Docker compose files in `backend/` spin up Postgres with `pnpm --filter ./backend docker:dev`. PM2 ecosystem configuration handles production restarts—modify it only for deployment-related changes.
