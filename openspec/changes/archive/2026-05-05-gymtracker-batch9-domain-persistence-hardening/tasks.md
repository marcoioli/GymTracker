# Tasks: GymTracker Batch 9 Domain Persistence Hardening

## Phase 1: Domain guards

- [x] 1.1 Add explicit validation/sanitization helpers in `src/domain/sessions.ts` for numeric input normalization and structurally valid session snapshots.
- [x] 1.2 Extend `src/domain/routines.ts` with safe progress-resolution helpers and any invariants needed for trainable-day or routine-state consistency.
- [x] 1.3 Add unit tests in `src/domain/*.test.ts` for invalid drafts, stale progress, decimal parsing, and omitted set inputs.

## Phase 2: Repository hardening

- [x] 2.1 Update `src/features/session/sessionRepository.ts` to apply domain guards before writing snapshots and before exposing previous references.
- [x] 2.2 Update `src/features/routines/routinesRepository.ts` to resolve orphaned or conflicting active routine state deterministically.
- [x] 2.3 Modify `src/db/database.ts` only if a Dexie version bump or index change is needed to support hardened persistence behavior.

## Phase 3: Integration verification

- [x] 3.1 Add or update integration tests covering restored/inconsistent local data, active routine fallback, and partial historical snapshots.
- [x] 3.2 Run `npm run test:run` and `npm run test:e2e`, fixing only real regressions introduced by the hardening work.
