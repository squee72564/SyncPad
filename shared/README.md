  # Shared Packages

  - `@syncpad/prisma-client` – exports a singleton Prisma client wired to the generated Postgres schema,
  including dev/test caching and a helper to disconnect cleanly with winston-aware logging.
  - `@syncpad/redis-client` – wraps the official `redis` client with a reconnect/backoff strategy,
  lifecycle logging hooks, and helpers to create or close a shared connection across backend and worker
  services.
