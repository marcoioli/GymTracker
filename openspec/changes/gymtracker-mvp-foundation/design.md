# Design: GymTracker MVP Foundation

## Technical Approach

Build GymTracker as a React + TypeScript + Vite PWA with a local-first architecture. UI, domain logic, persistence, and analytics stay in the client. The design separates **routine templates**, **executed workout sessions**, **exercise catalog**, and **routine runtime state** so routine edits never rewrite history.

## Architecture Decisions

### Decision: Local persistence with IndexedDB
**Choice**: Use IndexedDB through Dexie.
**Alternatives considered**: `localStorage`, embedded server, SQLite bridge.
**Rationale**: The app needs structured entities, historical volume, offline reads, and future chart queries. `localStorage` is too primitive; backend is unnecessary for single-user MVP.

### Decision: Snapshot sessions, editable templates
**Choice**: Save a full session snapshot when training starts/ends; keep routines editable.
**Alternatives considered**: Version every routine, or bind sessions directly to live template rows.
**Rationale**: User wants free routine editing without corrupting past workouts. Snapshotting is the clean separation.

### Decision: One active routine, many paused routines
**Choice**: Store one `activeRoutineId`; other routines remain paused or completed.
**Alternatives considered**: Many active routines.
**Rationale**: The home flow needs one dominant CTA and one suggested next day. Multiple active routines create ambiguity fast.

### Decision: Thin app shell, feature-first modules
**Choice**: Organize by feature (`routines`, `session`, `history`, `analytics`) with shared `domain`, `db`, and `ui`.
**Alternatives considered**: Flat component folders.
**Rationale**: The workspace is empty, so we can start with screaming architecture instead of a junk drawer.

## Data Flow

Home Dashboard → Start Workout CTA → Confirm Day Modal → Session Screen → Finish Workout
     │                    │                    │                 │
     └──── reads active routine/state ────────┴──── writes session snapshot ──→ IndexedDB
                                                                                 │
                                                                                 └──→ Analytics selectors

Sequence:
1. Dashboard loads active routine + next suggested day.
2. User confirms/overrides day.
3. App creates an in-memory session draft from the selected template day.
4. User records reps/weight/RIR with last-session references.
5. Finish action persists immutable session data and updates routine progress.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/App.tsx` | Create | App shell and top-level providers |
| `src/app/router.tsx` | Create | Mobile-first route structure |
| `src/app/providers.tsx` | Create | Dexie/store/theme/provider wiring |
| `src/db/database.ts` | Create | IndexedDB schema and table definitions |
| `src/domain/routines.ts` | Create | Routine, week, day, exercise template types |
| `src/domain/sessions.ts` | Create | Workout session snapshot types and status |
| `src/domain/analytics.ts` | Create | Derived metric contracts |
| `src/features/dashboard/*` | Create | Home dashboard and active routine CTA |
| `src/features/routines/*` | Create | Routine create/edit/activate flows |
| `src/features/session/*` | Create | Confirm-day modal and workout capture screen |
| `src/features/history/*` | Create | Historical session browsing |
| `src/features/analytics/*` | Create | Exercise and global metrics views |
| `src/shared/ui/*` | Create | Buttons, cards, numeric inputs, layout primitives |

## Interfaces / Contracts

```ts
type Routine = {
  id: string; name: string; status: 'active' | 'paused' | 'completed';
  weekCount: number; weeks: RoutineWeek[]; progress: RoutineProgress;
}

type ExerciseTemplate = {
  id: string; name: string; targetSets: number; targetRir: number | null;
}

type WorkoutSession = {
  id: string; routineId: string; weekIndex: number; dayId: string;
  status: 'completed' | 'ended-early';
  exercises: SessionExerciseSnapshot[]; startedAt: string; endedAt: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Progress calculation, next-day suggestion, adherence/volume selectors | Vitest |
| Integration | Routine creation, activation switch, session save with snapshot integrity | React Testing Library + fake IndexedDB |
| E2E | Start workout, override day, fill sets, finish early, inspect history | Playwright after foundation |

## Migration / Rollout

No migration required. This is a greenfield app. Batch 1 must also install testing, linting, and PWA tooling because the workspace is empty.

## Open Questions

- [ ] None blocking; design is ready for task breakdown.
