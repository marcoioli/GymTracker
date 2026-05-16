# InsForge Backend Sync — Implementation Tasks

**Change:** `insforge-backend-sync`
**Issue:** #64
**Phase:** tasks
**Status:** complete

## Delivery Contract

- Delivery strategy: **forced chained PRs**.
- Review budget: **400 changed lines max per PR**.
- Base branch: `staging` unless hotfix rules apply.
- Every PR must link an approved issue and include validation evidence.
- Fresh-context review is required before commit/push/PR readiness.
- Do not mutate the live InsForge parent backend until backend branch validation and user approval.

## Review Workload Forecast

This full backend effort is far above 400 lines and spans auth, schema, RLS, local DB, sync, import, routines, sessions, history, analytics, tests, and UX copy.

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
Resolved delivery path: auto-chain, forced chained PRs, current slice PR 1.1 only
Chained PRs required: Yes
Chain strategy detail: forced chained PRs
400-line budget risk detail: Certain
Implementation must be split before apply.
```

## Phase 0 — SDD Artifact PR

### PR 0.1 — OpenSpec SDD artifacts

**Goal:** Land planning artifacts only.

**Files:**

- `openspec/changes/insforge-backend-sync/explore.md`
- `openspec/changes/insforge-backend-sync/proposal.md`
- `openspec/changes/insforge-backend-sync/specs/*.md`
- `openspec/changes/insforge-backend-sync/design.md`
- `openspec/changes/insforge-backend-sync/tasks.md`
- optional copied `sdd-context/*.md` if useful for review

**Tasks:**

1.1 Confirm artifacts are complete and coherent.
1.2 Add `.insforge/` to `.gitignore` so linked project metadata and admin API keys cannot be committed.
1.3 Run markdown/link sanity checks manually.
1.4 Run `git diff --check`.
1.5 Run fresh review of SDD artifacts and secret-safety changes.
1.6 Commit with conventional message.
1.7 Open PR to `staging` linked to issue #64.

**Validation:**

- Fresh reviewer: SDD coherence, no implementation code, no secrets.
- `git diff --check`.

**Exit criteria:** PR merged before implementation starts.

---

## Phase 1 — SDK and Environment Foundation

### PR 1.1 — InsForge SDK/env foundation

**Goal:** Add safe SDK plumbing without changing app behavior.

**Expected files:**

- `package.json`
- `package-lock.json`
- `.env.example`
- `src/lib/insforgeClient.ts`
- `src/lib/insforgeClient.test.ts` or equivalent

**Tasks:**

- [x] 1.1 Install `@insforge/sdk@latest`.
- [x] 1.2 Add `.env.example` with `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY`.
- [x] 1.3 Ensure `.env`, `.env.local`, `.env*.local`, and `.insforge/` remain ignored.
- [x] 1.4 Implement a small client factory reading only Vite public env vars.
- [x] 1.5 Add tests for missing env behavior and no admin/API key usage.
- [x] 1.6 Add a validation step proving `.insforge/project.json` is ignored and absent from staged files.

**Validation:**

- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- Fresh review for secret-safety.

**Notes:** No auth gate yet. No backend mutations.

---

## Phase 2 — Backend Branch and Schema/RLS Foundation

### PR 2.1 — InsForge migration scaffolding

**Goal:** Add migrations directory and first schema/RLS migration, tested on backend branch.

**Expected files:**

- `migrations/<timestamp>_create_insforge_backend_sync_schema.sql`
- optional `docs/insforge-backend-runbook.md`
- optional `insforge.toml` only for supported auth redirect config

**Tasks:**

2.1 Verify CLI auth/project using `npx @insforge/cli whoami` and `current`.
2.2 Inspect metadata, tables, policies, migrations.
2.3 Create InsForge backend branch `backend-sync` with schema-only mode if available.
2.4 If branch is unavailable, stop and ask user whether to create a dev project or proceed directly.
2.5 Fetch existing migrations.
2.6 Create schema migration for core tables:

- `profiles`
- `app_state`
- `exercise_catalog`
- `routines`
- `routine_weeks`
- `routine_days`
- `routine_exercises`
- `routine_exercise_set_references`
- `workout_sessions`
- `session_exercises`
- `session_sets`
- `import_batches`
- optional `sync_conflicts`

2.7 Add indexes/constraints from design.
2.8 Add RLS enablement and policies.
2.9 Add composite parent ownership constraints or equivalent parent-ownership checks for child tables.
2.10 Apply to backend branch only.
2.11 Inspect tables/indexes/policies after apply.
2.12 Add RLS smoke for cross-user child insert attempts.
2.13 Save dry-run merge SQL if supported.

**Validation:**

- `npx @insforge/cli db migrations list`
- `npx @insforge/cli db tables`
- `npx @insforge/cli db indexes`
- `npx @insforge/cli db policies`
- RLS smoke: unauthenticated blocked; user-owned access allowed; cross-user blocked; child rows cannot reference another user's parent IDs.
- Fresh reviewer for migration/RLS.

**Notes:** This PR can be migration/runbook only. Do not wire app behavior yet.

---

## Phase 3 — Auth Gate

### PR 3.1 — Auth domain/client state

**Goal:** Add auth state management and session restore without blocking entire router yet.

**Expected files:**

- `src/features/auth/authRepository.ts`
- `src/features/auth/authTypes.ts`
- `src/features/auth/authRepository.test.ts`
- maybe `src/app/AuthProvider.tsx`

**Tasks:**

3.1 Implement wrapper functions for sign in, sign up, sign out, reset password, current user.
3.2 Implement auth session state provider/hook.
3.3 Test success/error states with mocked InsForge SDK.
3.4 Persist `currentUserId` into local sync state after login.

**Validation:** lint, typecheck, tests.

### PR 3.2 — Login gate UI and router protection

**Goal:** Require login before app use.

**Expected files:**

- router/app shell files
- `src/features/auth/LoginPage.tsx`
- auth CSS in `global.css` if needed
- e2e auth-gate tests

**Tasks:**

3.5 Add login/signup/reset UI.
3.6 Gate protected app routes until authenticated.
3.7 Preserve legacy local data on disk but block new local writes before login.
3.8 Add sign-out flow that returns to login and keeps local data.
3.9 Add e2e for fresh install login gate and session restore.

**Validation:**

- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run test:e2e`

---

## Phase 4 — Local Sync Metadata Foundation

### PR 4.1 — Dexie sync stores and types

**Goal:** Add local sync metadata without remote sync behavior.

**Expected files:**

- `src/db/database.ts`
- `src/features/sync/syncTypes.ts`
- `src/features/sync/syncMetadataRepository.ts`
- tests

**Tasks:**

4.1 Add Dexie version migration for `syncQueue` and `syncState` or equivalent.
4.2 Add sync status and ownership types, including `ownerUserId` and `legacy-unclaimed` state.
4.3 Add repository helpers to enqueue, mark syncing, mark failed, mark synced, mark conflict.
4.4 Scope authenticated local reads by current user and quarantine unclaimed legacy rows.
4.5 Add tests for migration/defaults and cross-account local-cache isolation.

**Validation:** lint, typecheck, test:run.

### PR 4.2 — Sync status UI shell

**Goal:** Show sync/offline state without actual remote sync.

**Tasks:**

4.5 Add small sync status surface, likely under `Más` and/or app banner.
4.6 Show pending/error states from local queue.
4.7 Avoid disrupting workout screen.
4.8 Add E2E smoke if visible behavior changes.

---

## Phase 5 — Manual Import

### PR 5.1 — Import preview domain

**Goal:** Build pure import preview/validation logic.

**Expected files:**

- `src/features/import/importPreview.ts`
- tests

**Tasks:**

5.1 Read candidate data from Dexie snapshot or backup payload.
5.2 Normalize legacy routines/sessions/catalog/appState using existing normalizers.
5.3 Produce preview counts/warnings/conflicts.
5.4 Detect existing cloud/local conflict conditions in a testable abstraction.

**Validation:** unit tests for legacy data, invalid backup, duplicate IDs.

### PR 5.2 — Import UI and enqueue

**Goal:** Add manual import UX after login.

**Tasks:**

5.5 Add import entry point after login and/or Backup page.
5.6 Show preview and explicit confirmation.
5.7 Enqueue import batch and entity upserts.
5.8 Preserve local data after import.
5.9 Add E2E for import preview/confirm.

### PR 5.3 — Remote import apply

**Goal:** Upload import batch to InsForge safely.

**Tasks:**

5.10 Implement remote upsert calls for imported rows.
5.11 Record `import_batches` status.
5.12 Stop on conflicts and surface resolution path.
5.13 Validate against backend branch.

---

## Phase 6 — Routine Sync

### PR 6.1 — Routine graph serializer

**Goal:** Convert local nested routines to/from relational remote row groups.

**Tasks:**

6.1 Add pure serialization/deserialization utilities.
6.2 Preserve IDs and positions.
6.3 Preserve progress fields and set reference targets.
6.4 Add tests for roundtrip and legacy normalization.

### PR 6.2 — Routine push/pull service

**Goal:** Sync routines and exercise catalog.

**Tasks:**

6.5 Push dirty routines and catalog entries.
6.6 Pull remote routines into Dexie cache.
6.7 Upsert catalog by normalized name.
6.8 Mark sync statuses.
6.9 Add backend branch smoke tests.

### PR 6.3 — Active routine convergence/conflicts

**Goal:** Implement account-wide active routine semantics.

**Tasks:**

6.10 Sync `app_state.activeRoutineId`.
6.11 Enforce/handle one active routine.
6.12 Detect routine edit conflicts.
6.13 Add UX for keep local / keep remote / duplicate copy if needed.

---

## Phase 7 — Session Snapshot Sync

### PR 7.1 — Session graph serializer

**Goal:** Convert local immutable session snapshots to/from remote rows.

**Tasks:**

7.1 Serialize `WorkoutSession` into `workout_sessions`, `session_exercises`, `session_sets`.
7.2 Deserialize remote rows back to current local session shape.
7.3 Preserve snapshot labels/names/targets/muscles/notes.
7.4 Add tests for roundtrip, null numeric values, decimal values, ended-early.

### PR 7.2 — Session upload and idempotency

**Goal:** Upload completed sessions after local save.

**Tasks:**

7.5 Enqueue session upload when saving workout.
7.6 Implement idempotent remote upsert by session UUID.
7.7 Avoid duplicate sessions on retry.
7.8 Mark sync state and errors.
7.9 Validate offline save then later sync.

### PR 7.3 — Session pull and previous references

**Goal:** Pull remote sessions and keep previous-session references working across devices.

**Tasks:**

7.10 Pull remote sessions ordered by `ended_at`.
7.11 Rehydrate local Dexie session records.
7.12 Ensure `getPreviousSessionReferences` sees pulled sessions.
7.13 Add tests/e2e for cross-device-like pulled session.

---

## Phase 8 — History and Analytics Integration

### PR 8.1 — History with synced cache

**Goal:** Ensure history works over local cache containing both local and pulled remote sessions.

**Tasks:**

8.1 Preserve filters and detail route behavior.
8.2 Ensure deleted/missing routine still shows snapshot data.
8.3 Update copy that says local-only/no cloud.
8.4 E2E history smoke.

### PR 8.2 — Analytics with synced cache

**Goal:** Preserve current analytics semantics with synced data.

**Tasks:**

8.5 Keep client-side analytics over local Dexie cache for v1.
8.6 Use selected timezone policy consistently.
8.7 Ensure milestones remain snapshot-based.
8.8 Update copy.
8.9 E2E analytics smoke.

---

## Phase 9 — Backup, Status, Docs, Rollout

### PR 9.1 — Backup/restore semantics after sync

**Goal:** Preserve local JSON backup and make cloud behavior clear.

**Tasks:**

9.1 Keep local export format compatible.
9.2 Keep local restore destructive only for local cache.
9.3 After restore, offer manual import/sync rather than automatic remote overwrite.
9.4 Update Backup page copy.
9.5 E2E backup restore.

### PR 9.2 — Runbook and rollout docs

**Goal:** Document operations and rollback.

**Expected files:**

- `docs/insforge-backend-runbook.md` or similar
- maybe update `CONTRIBUTING.md`

**Tasks:**

9.6 Document env vars and InsForge CLI commands.
9.7 Document backend branch workflow.
9.8 Document migration apply/rollback policy.
9.9 Document manual smoke checklist.
9.10 Document known non-goals/future work.

---

## Cross-Cutting Apply Rules

- Before schema work, inspect live/branch backend state with CLI.
- Use `npx @insforge/cli`, never a global CLI.
- Never commit secrets.
- Never expose admin/API key in frontend code.
- Use backend branch for schema/RLS/auth changes if available.
- If branch unavailable, stop and ask the user.
- Keep workout session flow fast and local-first.
- Split any PR that exceeds 400 changed lines.
- Run fresh review after each implementation slice.

## Required Validation by PR Type

| PR type | Required validation |
| --- | --- |
| SDD/docs | `git diff --check`, fresh review |
| frontend code | lint, typecheck, test:run, E2E if user flow affected |
| Dexie migration | repository/unit tests plus local reload smoke |
| InsForge migration | CLI metadata/tables/policies checks, branch apply, RLS smoke |
| sync/import | unit tests, E2E where possible, backend branch smoke |
| auth | auth tests, E2E login/session restore/sign-out |

## Dependencies

```text
PR 0 SDD
  ↓
PR 1 SDK/env foundation
  ↓
PR 2 schema/RLS branch
  ↓
PR 3 auth gate
  ↓
PR 4 sync metadata
  ↓
PR 5 manual import
  ↓
PR 6 routine sync
  ↓
PR 7 session sync
  ↓
PR 8 history/analytics
  ↓
PR 9 backup/status/docs
```

Some PRs may be split further if the 400-line budget is exceeded.

## Phase Result

```yaml
status: complete
executive_summary: Tasks split the InsForge backend into chained, reviewable slices: SDD, SDK/env, schema/RLS, auth, sync metadata, manual import, routine sync, session sync, history/analytics, and backup/docs.
artifacts:
  - openspec/changes/insforge-backend-sync/tasks.md
next_recommended: fresh review of SDD artifacts, then PR 0 to staging
risks:
  - backend branch availability remains apply-time blocker
  - auth provider still defaults to email/password until confirmed
  - several sync slices may need further splitting to stay under 400 lines
skill_resolution: injected
```
