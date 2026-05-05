# Tasks: GymTracker Batch 7 E2E Edge Cases

## Phase 1: E2E foundation

- [x] 1.1 Review `e2e/mvp-flow.spec.ts` and `e2e/backup-flow.spec.ts` to extract reset/seed helpers only where duplication already exists.
- [x] 1.2 Create `e2e/edge-workout-flow.spec.ts` with dashboard blocked-start, suggested-day override, and early-finish persistence scenarios.
- [x] 1.3 Create `e2e/offline-persistence.spec.ts` with reload, empty-history, empty-analytics, and active-vs-paused routine scenarios.

## Phase 2: Backup regression coverage

- [x] 2.1 Extend `e2e/backup-flow.spec.ts` to cover invalid file rejection without exposing restore confirmation.
- [x] 2.2 Extend `e2e/backup-flow.spec.ts` to verify destructive warning copy and restored-data-only navigation after replace.

## Phase 3: UI hardening for testability

- [x] 3.1 Adjust `src/features/dashboard/DashboardPage.tsx` only if blocked-start or reload states need clearer observable copy.
- [x] 3.2 Adjust `src/features/backup/BackupPage.tsx`, `src/features/history/HistoryPage.tsx`, or `src/features/analytics/AnalyticsPage.tsx` only if empty states or restore states are not stably testable.

## Phase 4: Verification

- [x] 4.1 Verify the new E2E scenarios cover every requirement in `specs/edge-case-e2e-coverage/spec.md`.
- [x] 4.2 Verify the new E2E scenarios cover every requirement in `specs/backup-flow-regression-protection/spec.md` and `specs/offline-persistence-regression-checks/spec.md`.
- [x] 4.3 Run `npm run test:run` and `npm run test:e2e`, fixing only real contract regressions.
