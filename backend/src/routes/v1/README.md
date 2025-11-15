## Health

- `GET` `/v1/health` returns a simple heartbeat payload (HTTP 200, timestamp, uptime) so external monitors can verify the API is alive without touching business logic (backend/src/routes/v1/health.route.ts).

## Auth

- `ALL` `/v1/auth/{*any}` forwards every Better Auth handler into Express, exposing signup/login/session endpoints exactly as defined by the authentication library before JSON parsing middleware runs (backend/src/routes/v1/auth.route.ts:7, backend/src/routes/v1/index.ts).

## User

- `GET` `/v1/user/self` authenticates a logged-in user and returns their profile plus current session details to power account menus and workspace switchers (backend/src/routes/v1/user.route.ts).
- `GET` `/v1/user/:id` exposes a sanitized public profile, gated by the publicUser:listPublicUsers permission so team members can look up collaborators (backend/src/routes/v1/user.route.ts).
- `GET` `/v1/user` lists public user profiles for directory-style UIs, again tied to the public user permission set (backend/src/routes/v1/user.route.ts).

## Admin

- `PATCH/DELETE` `/v1/admin/users/:userId` lets elevated operators update account metadata or remove a user entirely, enforcing admin roles plus per-action scopes (backend/src/routes/v1/admin.route.ts).
- `PATCH` `/v1/admin/users/:userId/role` upgrades or downgrades a user’s global role, supporting escalations or demotions (backend/src/routes/v1/admin.route.ts).
- `PATCH` `/v1/admin/users/:userId/password` sets a user’s password directly for recovery or enforcement scenarios (backend/src/routes/v1/admin.route.ts).
- `PATCH` `/v1/admin/users/:userId/ban` and PATCH /v1/admin/users/:userId/unban toggle global bans to block abusive accounts (backend/src/routes/v1/admin.route.ts).
- `GET` `/v1/admin/users/:userId/sessions` lists all sessions tied to a user; DELETE variants revoke every session or a single session token for forced logouts (backend/src/routes/v1/admin.route.ts).
- `POST/DELETE` `/v1/admin/users/:userId/impersonate` begins or ends admin impersonation so support can reproduce issues as the target user (backend/src/routes/v1/admin.route.ts).
- `GET` `/v1/admin/users` shows the full user roster, while POST /v1/admin/users creates a brand-new account, both behind admin auth (backend/src/routes/v1/admin.route.ts).

## Workspaces

- `GET` `/v1/workspaces` lists every workspace the requester can access; POST /v1/workspaces provisions a new workspace shell (backend/src/routes/v1/workspace.route.ts).
- `GET` `/v1/workspaces/:workspaceId` loads workspace metadata after attaching context and checking workspace:view permission; PATCH allows owners/admins to adjust workspace settings; DELETE lets owners remove the workspace entirely (backend/src/routes/v1/workspace.route.ts).
- `GET` `/v1/workspaces/:workspaceId/members` returns membership rosters for dashboards (backend/src/routes/v1/workspace.route.ts).
- `DELETE/PATCH` `/v1/workspaces/:workspaceId/members/:memberId` remove a member or change their role, combining role + permission checks to prevent privilege abuse (backend/src/routes/v1/workspace.route.ts).
- `GET/POST` `/v1/workspaces/:workspaceId/invites` manage pending invites (list + create) for RBAC-controlled onboarding (backend/src/routes/v1/workspace.route.ts).
- `POST` `/v1/workspaces/:workspaceId/invites/:inviteId/resend` re-sends an invite email
- `DELETE` `/v1/workspaces/:workspaceId/invites/:inviteId` revokes an outstanding invite token (backend/src/routes/v1/workspace.route.ts).
- `POST` `/v1/workspaces/invites/:token/accept` lets an invitee redeem their token to become a member; this is the public-facing acceptance entry point (backend/src/routes/v1/workspace.route.ts).

## Documents

- `GET` `/v1/workspaces/:workspaceId/documents` lists workspace documents according to query filters, ensuring the caller has document:read permission inside the bound workspace (backend/src/routes/ v1/document.route.ts).
- `POST` `/v1/workspaces/:workspaceId/documents` creates a new document under the workspace with slug/permission validation (backend/src/routes/v1/document.route.ts).
- `GET` `/v1/workspaces/:workspaceId/documents/:documentId` fetches a single document; it optionally trusts share-link tokens via allowShareLinks for public previews (backend/src/routes/v1/ document.route.ts).
- `PATCH` `/v1/workspaces/:workspaceId/documents/:documentId` updates metadata/content for authorized members; DELETE removes the document when document:delete is granted (backend/src/routes/v1/document.route.ts).
- `PATCH` `/v1/workspaces/:workspaceId/documents/:documentId/collab-state` saves the latest draft collaboration snapshot (structured JSON today, future CRDT state) and is limited to users with `document:update` permission while the document is in DRAFT status.

## Share Links

- `GET/POST` `/v1/workspaces/:workspaceId/documents/:documentId/share-links` list all share links on a
  document or create a new tokenized link for copying into the dashboard (backend/src/routes/v1/share-link.route.ts).
- `PATCH/DELETE` `/v1/workspaces/:workspaceId/documents/:documentId/share-links/:shareLinkId` rotate permissions/expiry or revoke an existing link (backend/src/routes/v1/share-link.route.ts).
- `GET` `/v1/share-links/:token` is the unauthenticated preview endpoint that validates the token and returns the document preview payload for public viewers (backend/src/routes/v1/share-link.public.route.ts).

## Activity Logs

- `GET` `/v1/workspaces/:workspaceId/activity-logs` returns the workspace timeline with cursor-based pagination and optional actor/document/event filters; the dashboard uses this for the Activity view (backend/src/routes/v1/activity-log.route.ts).
- `POST` `/v1/workspaces/:workspaceId/activity-logs` appends an activity entry (actor, document, metadata) so the workspace timeline stays in sync with user actions (backend/src/routes/v1/activity-log.route.ts).
- `DELETE` `/v1/workspaces/:workspaceId/activity-logs/:activityLogId` prunes a specific log entry, letting admins clean noisy events (backend/src/routes/v1/activity-log.route.ts).
