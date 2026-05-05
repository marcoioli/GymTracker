# Design: GymTracker Batch 5 UX Optimizations

## Technical Approach

Improve UX without changing core persistence or session domain rules. The work focuses on presentation, action hierarchy, reusable UI primitives, and mobile ergonomics around the already-working workout flow.

## Architecture Decisions

### Decision: UX polish stays above the domain
**Choice**: Keep routine/session repositories unchanged unless a UX bug exposes a real data-flow issue.
**Alternatives considered**: Reworking domain and persistence during UX batch.
**Rationale**: This batch is about speed and clarity, not rewriting stable logic.

### Decision: Reuse shared UI primitives more aggressively
**Choice**: Push buttons, cards, numeric fields, section wrappers, and feedback states through `src/shared/ui/*`.
**Alternatives considered**: Styling each screen ad hoc.
**Rationale**: Consistency reduces visual noise and future maintenance.

### Decision: Session screen gets progress-oriented grouping
**Choice**: Highlight exercise block, previous reference, and active set input as one unit.
**Alternatives considered**: Flat table-like rows only.
**Rationale**: In a gym context the user needs scanability more than dense data tables.

## Data Flow

Dashboard CTA → Confirm Day Modal → Session Screen → Save Status → Dashboard/History
      │               │                  │
      └── no domain rewrite ────────────┴── uses existing session persistence

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/session/WorkoutSessionScreen.tsx` | Modify | Improve grouping, feedback, and finishing states |
| `src/features/session/ConfirmWorkoutDayModal.tsx` | Modify | Refine action hierarchy and scanability |
| `src/features/dashboard/DashboardPage.tsx` | Modify | Clarify CTA dominance and supporting text |
| `src/shared/ui/*` | Modify | Consolidate button/input/card behavior and sizing |
| `src/styles/global.css` | Modify | Add mobile spacing, focus, and session-specific polish |
| `e2e/mvp-flow.spec.ts` | Modify | Keep E2E aligned with the refined UX |

## Interfaces / Contracts

No new domain contracts required. Existing session and routine models remain source of truth.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | None if domain stays stable | Keep existing domain tests green |
| Integration | Session screen labels, references, feedback states | React Testing Library |
| E2E | Main flow still works after UX polish | Playwright |

## Migration / Rollout

No migration required. UX-only batch over stable local data.

## Open Questions

- [ ] None blocking.
