# Express TypeScript Boilerplate

This is a production-ready TypeScript Express boilerplate with security, validation, logging, linting, and development tooling pre-configured.

## Features

- Express web server with TypeScript
- Security middleware: Helmet, CORS, HPP, rate limiting, XSS protection, compression
- Validation with Zod
- Centralized logging with Winston and Morgan
- Environment variable management with dotenv
- Optional process management with PM2
- Pre-configured linting and formatting (ESLint + Prettier)
- Git hooks and pre-commit automation (Husky + lint-staged)
- Fast TypeScript compilation with tsup
- Custom utilities for async route error handling and input sanitization, base Error class etc.

## Dependencies

| Category                   | Library / Utility                     | Purpose / Notes                                     |
| -------------------------- | ------------------------------------- | --------------------------------------------------- |
| **Core**                   | `express`                             | Web framework                                       |
| **ORM / Database**         | `prisma`                              | Type-safe ORM and query builder                     |
|                            | `@prisma/client`                      | Prisma runtime client                               |
| **Authentication**         | `better-auth`                         | Lightweight, extensible authentication, RBAC system |
| **Security Middleware**    | `helmet`                              | HTTP headers security                               |
|                            | `cors`                                | Cross-Origin Resource Sharing                       |
|                            | `hpp`                                 | HTTP parameter pollution protection                 |
|                            | `express-rate-limit`                  | Rate limiting to prevent abuse                      |
|                            | `xss-filters`                         | Sanitizes user input                                |
|                            | `compression`                         | Response compression middleware                     |
| **Validation**             | `zod`                                 | Schema validation for request data                  |
| **Error Handling**         | `ApiError` (`/src/utils/ApiError.ts`) | Custom Error class for standardized API errors      |
|                            | `/src/middleware/error.ts`            | Custom middlewares for error conversion/handling    |
| **Logging**                | `winston`                             | General purpose logging library                     |
|                            | `morgan`                              | Logging for HTTP requests                           |
| **Environment**            | `dotenv`                              | Load `.env` configuration variables                 |
|                            | `dotenv-cli`                          | CLI for loading env files                           |
| **Process Management**     | `pm2`                                 | Optional process manager for production             |
| **Dev Tools / TypeScript** | `typescript`                          | TypeScript compiler                                 |
|                            | `tsup`                                | Fast TypeScript bundler for Node.js                 |
|                            | `nodemon`                             | Hot-reload dev server                               |
|                            | `typescript-eslint`                   | TypeScript ESLint parser and rules                  |
| **Linting / Formatting**   | `eslint`                              | Code linting                                        |
|                            | `@eslint/js`                          | ESLint JS parser plugin                             |
|                            | `globals`                             | Global identifiers for ESLint                       |
|                            | `eslint-config-prettier`              | Disable ESLint rules that conflict with Prettier    |
|                            | `eslint-plugin-prettier`              | Run Prettier as an ESLint rule                      |
|                            | `prettier`                            | Code formatting                                     |
| **Git Hooks / Automation** | `husky`                               | Git hooks (e.g., pre-commit)                        |
|                            | `lint-staged`                         | Run lint/format only on staged files                |

## Structure

```
src/
├── app.ts              # Express app initialization
├── server.ts           # Server entry point
├── config/             # Environment variables, winston/morgan logging setup
├── controllers/        # Orchestrate request handling logic
├── lib/                # Shared libraries (Auth / Permissions / Primsa setup / ect.)
├── middleware/         # Custom middleware
├── models/             # Domain models/ORM schema type extensions
├── routes/             # Express route definitions
├── services/           # Services
├── types/              # TypeScript type definitions and declarations
├── utils/              # General-purpose utils
└── validations/        # Schema-based request validation
```

### API Highlights

- `routes/v1/workspace.route.ts` exposes workspace CRUD endpoints (`GET/POST /workspaces`, `GET/PATCH/DELETE /workspaces/:workspaceId`) with Zod validation and workspace-aware middleware.
- `routes/v1/document.route.ts` adds document CRUD under `/workspaces/:workspaceId/documents`, reusing workspace context middleware, enforcing document permissions, and honoring share-link access when configured.
- `controllers/workspace.controller.ts` and `controllers/document.controller.ts` consolidate request handling using Prisma-backed services wrapped in `catchAsync`.
- `services/workspace.service.ts` and `services/document.service.ts` provide database accessors for listing, creating, updating, and deleting workspaces/documents while normalizing slugs, validating parent relationships, and surfacing friendly Prisma conflicts.
- `middleware/workspace.ts` enriches requests with workspace context and now auto-detects CUID vs slug identifiers when `workspaceLookup` is left as `auto`.

## Scripts

```json
{
  "scripts": {
    "build": "rimraf dist && tsup",
    "pretty": "npx prettier ./src --write",
    "pretty:check": "npx prettier ./src --check",
    "lint": "npx eslint . --fix",
    "lint:check": "npx eslint .",
    "seed:dev": "NODE_ENV=development tsx ./scripts/seed.ts",
    "start": "NODE_ENV=production node dist/server.js",
    "start:dev": "NODE_ENV=development nodemon --watch src --ext ts --exec tsx src/server.ts",
    "start:pm2": "NODE_ENV=production pm2 start dist/server.js --name express-backend",
    "restart:pm2": "NODE_ENV=production pm2 restart express-backend",
    "auth:generate": "NODE_ENV=development npx @better-auth/cli generate --config src/lib/auth.ts",
    "prisma:generate": "pnpm prisma:generate:dev",
    "prisma:generate:dev": "dotenv -e .env.development -- prisma generate",
    "prisma:generate:prod": "dotenv -e .env.production -- prisma generate",
    "prisma:migrate": "pnpm prisma:migrate:dev",
    "prisma:migrate:dev": "dotenv -e .env.development -- prisma migrate dev",
    "prisma:migrate:prod": "dotenv -e .env.production -- prisma migrate dev",
    "prisma:migrate:deploy": "dotenv -e .env.$NODE_ENV -- prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:push": "prisma db push",
    "docker:dev": "docker compose up -d",
    "docker:dev:logs": "docker compose logs -f postgres",
    "docker:dev:down": "docker compose down",
    "docker:prod": "docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d",
    "docker:prod:logs": "docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f postgres",
    "docker:prod:down": "docker compose -f docker-compose.yml -f docker-compose.prod.yml down",
    "prepare": "husky install"
  }
}
```

## Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.development .env.production
   ```

- Change development and production env vars as needed

3. Start the postgres database and pgbouncer:

   ```bash
   pnpm docker:dev
   ```

4. Generate Prisma client:

   ```bash
   pnpm prisma:generate
   ```

5. Run migrations:

   ```bash
   pnpm prisma:migrate
   ```

6. Start development server:
   ```bash
   pnpm start:dev
   ```

## Production

1. Build the application:

   ```bash
   pnpm build
   ```

2. Run migrations:

   ```bash
   pnpm prisma:migrate:deploy
   ```

3. Start with Node:

   ```bash
   pnpm start
   ```

   Or with PM2:

   ```bash
   pnpm start:pm2
   ```

   Or with Docker:

   ```bash
   To Be Added Soon
   ```