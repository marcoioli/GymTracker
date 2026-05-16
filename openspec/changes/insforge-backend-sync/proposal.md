# InsForge Backend Sync — Proposal

**Change:** `insforge-backend-sync`
**Issue:** #64
**Phase:** proposal
**Status:** complete

## Intent

Build the backend foundation for GymTracker/Treino using InsForge while preserving the app's fast mobile workout experience. The backend will provide mandatory account login, user-owned cloud data, secure RLS-protected storage, and a sync architecture over the existing local Dexie cache.

This SDD plans the full backend direction and splits delivery into chained PRs. It does **not** mutate the live InsForge backend during planning.

## Approved Product Decisions

- The app remains **local-first/offline-capable** internally, using Dexie for fast workout UX.
- InsForge becomes the authenticated backend for account-owned sync and cloud data.
- Login is **mandatory in v1** before using the app UI.
- Existing local IndexedDB data is migrated via **manual import**, not automatic upload.
- Delivery uses **forced chained PRs**.
- Each PR targets a maximum review budget of **400 changed lines**.

## Scope

### In scope

- InsForge SDK setup plan for Vite.
- Auth/login gate design.
- User-owned relational Postgres schema plan.
- RLS/user isolation policy plan.
- Local sync metadata and repository architecture.
- Manual import plan for existing local backup/IndexedDB data.
- Routine sync strategy.
- Immutable workout session sync strategy.
- History and analytics preservation strategy.
- Backup/restore semantics after cloud sync.
- InsForge backend branch and migration workflow.
- Chained PR implementation plan.
- Rollback and validation plan.

### Out of scope for this SDD artifact PR

- Applying real migrations to the linked InsForge backend.
- Adding `@insforge/sdk` app code.
- Building the login UI.
- Rewriting repositories.
- Deploying edge functions.
- Merging InsForge backend branch into the parent project.

### Out of scope for backend v1 unless later approved

- Social/OAuth providers beyond the selected v1 auth method.
- Profile avatars/storage buckets.
- Real-time cross-device sync.
- Server-side analytics as the primary analytics engine.
- Editing historical workout sessions.
- Destructive remote restore without import preview/confirmation.
- Multi-account local cache switching.

## Affected Areas

| Area | Likely files/artifacts |
| --- | --- |
| InsForge config | `.insforge/project.json` already exists, future `insforge.toml`, future `migrations/` |
| SDK/env | `package.json`, `.env.example`, future `src/lib/insforgeClient.ts` |
| Auth UX | future auth feature, router/app shell gating, More/Profile |
| Local DB | `src/db/database.ts` for sync metadata additions |
| Routines | `src/domain/routines.ts`, `src/features/routines/routinesRepository.ts`, `RoutinesPage.tsx` |
| Sessions | `src/domain/sessions.ts`, `src/features/session/sessionRepository.ts`, `WorkoutSessionScreen.tsx` |
| History/analytics | `src/features/history/*`, `src/features/analytics/*`, `src/domain/analytics.ts` |
| Backup/import | `src/domain/backup.ts`, `src/features/backup/*` |
| Tests | unit/repository/e2e tests plus future InsForge mocks/branch smoke tests |
| OpenSpec | `openspec/changes/insforge-backend-sync/**` |

## Architecture Decisions

### AD-1: Dexie remains the local UX source

**Decision:** Keep Dexie as the local cache/source for fast workout interactions. Add InsForge sync rather than replacing all reads/writes with remote calls immediately.

**Rationale:** The current app is explicitly local-first/offline-first. Workout logging must not block on network. Existing tests and product copy assume local durability.

### AD-2: Mandatory auth wraps app access, but import is manual

**Decision:** v1 requires login before app use. Existing local data is not silently uploaded. The user must explicitly import/claim local data after authentication.

**Rationale:** Login gives every remote row a real owner. Manual import avoids accidental remote overwrite or mixing old local data with an existing remote account.

### AD-3: Relational schema for durable backend model

**Decision:** Use normalized relational tables for routines, sessions, sets, catalog, app state, and sync metadata instead of storing the current nested Dexie documents as opaque JSON.

**Rationale:** Relational tables support RLS, indexes, idempotent upserts, future server-side analytics, and data integrity. Session snapshots still preserve denormalized historical labels/names.

### AD-4: RLS is part of foundation, not a later pass

**Decision:** Every user-owned table includes `user_id` and RLS policies from its first migration.

**Rationale:** Retrofitting RLS after data exists is risky. InsForge anon/client access must only reach authenticated user's rows.

### AD-5: Sessions are immutable/idempotent snapshots

**Decision:** Completed or ended-early sessions sync as immutable snapshot records keyed by client UUID. Re-uploading the same session is idempotent.

**Rationale:** Current history/analytics rely on frozen snapshots, and offline retries must not duplicate workouts.

### AD-6: Chained PRs are mandatory

**Decision:** Backend work will be split into reviewable PR slices. A slice exceeding 400 changed lines must be split again unless the user explicitly grants an exception.

**Rationale:** This change spans schema, security, auth, persistence, UI, and tests. Oversized PRs would be difficult to review safely.

## Success Criteria

- User cannot enter the app without login in v1.
- Frontend only uses `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY`; admin/API key is never exposed.
- InsForge schema is created through migrations on a backend branch or explicitly approved safe target.
- RLS prevents users from reading/writing each other's data.
- Existing local data can be manually imported after login.
- Routines, active routine state, exercise catalog, sessions, history, and analytics preserve current behavior after sync.
- Active workout screen remains fast and usable without waiting for network writes.
- Sessions remain immutable and idempotent after upload.
- Local JSON backup remains available.
- Chained PR plan keeps each PR within 400 changed lines where possible.
- Validation includes lint, typecheck, unit tests, E2E, and backend branch smoke/RLS checks before production rollout.

## Rollback Plan

### Planning artifact rollback

- Revert this OpenSpec change branch/PR.
- No live backend or app runtime changes occur during SDD planning.

### Implementation rollback strategy

- Keep Dexie path intact until remote sync is validated.
- Roll out backend behind auth/sync feature boundaries.
- Use InsForge backend branch for schema/RLS work before parent merge.
- Export schema/data before destructive backend operations.
- Keep migrations small and reviewable.
- Preserve local JSON backup/export as a fallback.
- If sync fails, disable remote sync UI while leaving local cache intact.
- If auth gate causes production issues, revert the auth-gating PR independently before later sync PRs land.

## Chained PR Delivery Strategy

Forced chained PRs with 400-line review budget:

1. SDD artifacts PR.
2. InsForge env/SDK foundation PR.
3. Schema/RLS migrations PR.
4. Auth gate PR.
5. Manual import PR.
6. Routine sync PR(s).
7. Session snapshot sync PR(s).
8. History/analytics integration PR(s).
9. Backup/sync status/rollout docs PR.

Each PR must link an approved issue, include validation evidence, and run fresh review before merge.

## Phase Result

```yaml
status: complete
executive_summary: The backend should be delivered as secure InsForge sync over Dexie, with mandatory login, manual import, RLS-first schema, immutable session snapshots, and forced chained PRs.
artifacts:
  - openspec/changes/insforge-backend-sync/proposal.md
next_recommended: spec
risks:
  - auth provider still needs final v1 selection
  - backend branch availability must be verified before migrations
  - local-first sync adds complexity but protects current UX
skill_resolution: injected
```
