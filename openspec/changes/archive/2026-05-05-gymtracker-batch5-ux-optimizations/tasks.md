# Tasks: GymTracker Batch 5 UX Optimizations

## Phase 1: UX Definition

- [x] 1.1 Refine `WorkoutSessionScreen.tsx` layout to reduce scan time per exercise and per set.
- [x] 1.2 Improve `ConfirmWorkoutDayModal.tsx` hierarchy so suggested vs override day selection is clearer.

## Phase 2: Shared UI / Styling

- [x] 2.1 Consolidate button and numeric input behavior in `src/shared/ui/*` for better mobile touch targets and feedback.
- [x] 2.2 Update `src/styles/global.css` with session-specific spacing, focus, alert and sticky action polish.

## Phase 3: Integration

- [x] 3.1 Update `DashboardPage.tsx` copy and CTA support state for better workout-start clarity.
- [x] 3.2 Keep history and analytics visually consistent with any shared UI changes needed for this batch.

## Phase 4: Verification

- [x] 4.1 Add or adjust integration tests for session feedback/reference rendering.
- [x] 4.2 Update `e2e/mvp-flow.spec.ts` only if the refined UX changes selectors or interaction order.
- [x] 4.3 Verify `npm run typecheck`, `npm run lint`, `npm run test:run`, and `npm run test:e2e`.
