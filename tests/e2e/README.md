# End-to-End Test Placeholder

This directory is reserved for Playwright-based journeys that exercise the combined backend and frontend stack. Until the suite is bootstrapped, document manual QA walkthroughs or throwaway scripts here so the team can track coverage gaps.

Recommended startup flow once tooling is installed:

1. `pnpm --filter ./backend start:dev` — start the API against a disposable Postgres.
2. `pnpm --filter ./frontend dev` — launch the Next.js UI.
3. Run Playwright specs with `pnpm exec playwright test` (to be added) targeting the above servers.
