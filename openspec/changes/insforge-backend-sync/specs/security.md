# Security and RLS — Spec

**Change:** `insforge-backend-sync`
**Area:** RLS/security/user isolation and InsForge env/config safety

## Spec 9 — RLS / Security / User Isolation

### Requirement 9.1: user_id on Every Table

Every user-owned database table **MUST** include a `user_id` column referencing the InsForge auth user ID.

### Requirement 9.2: RLS Policies From Day One

Row-level security policies **SHALL** be defined and active in the first migration for every user-owned table. RLS is not a later hardening pass.

### Requirement 9.3: Authenticated Access Only

Unauthenticated (anonymous) requests **MUST NOT** be able to read, write, update, or delete any user-owned database rows via the InsForge API.

### Requirement 9.4: User Isolation

An authenticated user **SHALL** only be able to access rows where `user_id` matches their own auth user ID. Cross-user data access **MUST NOT** be possible through the SDK or API.

### Requirement 9.5: Policy Coverage

RLS policies **SHALL** cover at minimum:
- `SELECT`: only rows where `user_id = current user`.
- `INSERT`: only rows where `user_id = current user`.
- `UPDATE`: only rows where `user_id = current user`.
- `DELETE`: only rows where `user_id = current user` (if deletion is allowed for the table).

### Requirement 9.6: RLS Testing

RLS policies **SHALL** be validated before production rollout:
- Authenticated user can access their own data.
- Authenticated user cannot access another user's data.
- Unauthenticated request cannot access any user data.
- Authenticated user cannot insert child rows that reference another user's parent rows.

### Requirement 9.7: Child Table Parent Ownership

Child tables **MUST** prevent cross-user parent references. An authenticated user **MUST NOT** be able to insert or update a child row with their own `user_id` if the referenced parent row belongs to another user. This **SHOULD** be enforced with composite foreign keys that include `user_id`, parent-ownership `WITH CHECK` policies, or trusted RPCs with equivalent checks.

## Spec 10 — InsForge Env/Config Safety

### Requirement 10.1: Frontend Env Vars Only

The frontend **SHALL** only use the following Vite env vars:
- `VITE_INSFORGE_URL` — the InsForge backend URL.
- `VITE_INSFORGE_ANON_KEY` — the InsForge anonymous/client API key.

### Requirement 10.2: No Admin/API Key in Frontend

The InsForge admin API key (stored in `.insforge/project.json`) **MUST NOT** be:
- Committed to the repository in any frontend-accessible form.
- Exposed through `VITE_*` env vars.
- Accessible from browser dev tools.
- Included in app bundle or source maps.

### Requirement 10.3: .insforge/project.json Protection

The `.insforge/project.json` file **MUST** remain in `.gitignore` or equivalent protection. It **SHALL NOT** be committed to version control.

### Requirement 10.4: .env.example Documentation

The repository **SHALL** include a `.env.example` file documenting required env vars (`VITE_INSFORGE_URL`, `VITE_INSFORGE_ANON_KEY`) without real values.

### Requirement 10.5: Backend Branch for Risky Changes

Schema, RLS, and auth configuration changes **SHOULD** be applied to an InsForge backend branch first. Direct changes to the parent/production backend **MUST** require explicit approval.

### Requirement 10.6: Migration Dry-Run

Before merging an InsForge backend branch into the parent project, a dry-run merge **SHOULD** be performed and the resulting SQL **SHALL** be reviewed.

### Requirement 10.7: CLI Usage

InsForge CLI operations **SHALL** use `npx @insforge/cli`, never a globally installed CLI.

### Requirement 10.8: SDK Usage

Application code **SHALL** use `@insforge/sdk` directly for database, auth, and storage operations. Deprecated React wrappers **SHALL NOT** be used.

## Scenarios

### Scenario 9.1 — RLS Isolates Users
**Given** two authenticated users A and B
**When** user A queries the routines table
**Then** only user A's routines are returned
**And** user B's routines are not visible

### Scenario 9.2 — Unauthenticated Access Blocked
**Given** an unauthenticated request
**When** the request attempts to query any user-owned table
**Then** the request is rejected
**And** no data is returned

### Scenario 9.2B — Cross-User Child Insert Blocked
**Given** user A owns a routine row
**And** user B is authenticated
**When** user B attempts to insert a `routine_days` or `session_sets` child row with user B's `user_id` but user A's parent ID
**Then** the insert MUST be denied

### Scenario 9.3 — Admin Key Not in Bundle
**Given** a production build of the app
**When** the bundle is inspected
**Then** the InsForge admin API key is not present in any file
**And** only `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY` values are exposed

### Scenario 9.4 — Backend Branch Workflow
**Given** a developer applying schema migrations
**When** they create a backend branch
**Then** migrations are applied to the branch first
**And** a dry-run merge produces reviewable SQL
**And** the parent backend is not mutated until explicit merge approval

### Scenario 10.1 — SDK Client Initialization
**Given** the app needs to connect to InsForge
**When** the InsForge client is initialized
**Then** it reads `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY` from Vite env
**And** the admin key from `.insforge/project.json` is not used
