# Tasks: GymTracker Batch 8 Design System Consolidation

## Phase 1: Foundations

- [x] 1.1 Audit `src/shared/ui/*` and `src/styles/global.css` to identify duplicated action, field, surface, empty-state, and status-feedback patterns.
- [x] 1.2 Create new shared primitives such as `src/shared/ui/Field.tsx`, `EmptyState.tsx`, and `StatusBanner.tsx` only for patterns already repeated in the product.
- [x] 1.3 Extend `src/shared/ui/Button.tsx`, `Card.tsx`, `PageSection.tsx`, and `index.ts` with the minimal variants required by the audited patterns.

## Phase 2: Styling consolidation

- [x] 2.1 Refactor `src/styles/global.css` to centralize semantic tokens and shared state classes without changing the app’s functional behavior.
- [x] 2.2 Remove duplicated style rules that become covered by shared primitives, keeping focus states and mobile touch targets intact.

## Phase 3: Screen migration

- [x] 3.1 Migrate `src/features/dashboard/DashboardPage.tsx`, `src/features/backup/BackupPage.tsx`, and `src/features/routines/RoutinesPage.tsx` to the new shared primitives.
- [x] 3.2 Migrate `src/features/history/HistoryPage.tsx`, `src/features/analytics/AnalyticsPage.tsx`, and session UI files to the same shared patterns for empty states and feedback surfaces.

## Phase 4: Verification

- [x] 4.1 Add or update RTL tests for new shared primitives and any screen-level semantics changed by the migration.
- [x] 4.2 Run `npm run test:run` and `npm run test:e2e`, fixing only real regressions caused by the UI consolidation.
