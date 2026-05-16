# Weight Suggestion – Design

**Change:** `weight-suggestion`
**Phase:** design
**Started:** 2026-05-14
**Status:** draft

---

## 1. Architecture Decisions

### AD-1: Pure computation in domain layer

**Decision:** The weight suggestion calculation lives in `src/domain/suggestions.ts` — a new file in the existing domain directory.

**Rationale:**

- The spec mandates purity (REQ-27): same inputs → same output, no side effects. The domain layer at `src/domain/` already holds pure domain functions (`sessions.ts`, `routines.ts`, `analytics.ts`, `backup.ts`).
- Zero UI/framework dependencies. The function takes plain objects, returns a plain result or null.
- Testable with `vitest` in `src/domain/suggestions.test.ts` via 15+ distinct test cases (acceptance criterion #2).
- `parseSessionNumericInput` already lives in `sessions.ts` and handles comma-to-dot normalization — reusable without duplication.

**Alternatives considered:**

- _Inline in the component:_ Rejected. Makes testing harder, couples computation to React render cycle, violates purity boundary.
- _New `features/session/suggestions.ts`:_ Rejected. No UI dependency needed. Feature-layer files should coordinate with repositories and hooks; `suggestions.ts` is pure math.

### AD-2: Suggestion as derived state via `useMemo`

**Decision:** The suggestion is computed inside `WorkoutSessionForm` via `useMemo`, not stored as separate React state.

**Rationale:**

- Suggestion is fully determined by `exerciseDrafts` + routine structure (both already in component state/props). No external async data needed.
- `useMemo` recomputes only when dependencies change (set inputs change), meeting REQ-28 (under 1 ms).
- No stale-state bugs: the suggestion is always consistent with the current draft state.
- No event-listener-based disappearance logic needed: the badge disappears naturally when the next set's inputs become non-empty, because the memo result becomes null for that set.

**Data flow:**

```
exerciseDrafts (state)  ──┐
selection (prop)         ─┤
                          ├──► useMemo ──► suggestions: Map<exerciseIdx_setIdx, WeightSuggestion>
                          │
                          ▼
                    render loop: for each set N (N>0, N<totalSets):
                      if suggestions.get(idx,N) exists AND nextSetInputs are empty:
                        render <WeightSuggestionBadge />
```

### AD-3: Badge is an inline component, not a separate feature file

**Decision:** `WeightSuggestionBadge` is defined as a simple functional component inside `WorkoutSessionScreen.tsx` (or co-located in `src/features/session/WeightSuggestionBadge.tsx` if the file grows too large).

**Rationale:**

- The badge has no independent lifecycle, no props apart from the suggestion result object, and trivial rendering (one colored chip with icon + text).
- It only makes sense in the context of the session form — no other screen needs it.
- Extract to a separate file if the component grows beyond ~30 lines, but YAGNI for v1.

**Placement in DOM:** Inside `.track-set-stack`, between the completed set row (`track-set-grid`) and the next set row. This satisfies REQ-26.

### AD-4: Target resolution as helper functions, not hooks

**Decision:** `resolveEffectiveTargetReps()` and `resolveRirTarget()` are exported pure helper functions in `src/domain/suggestions.ts`.

**Rationale:**

- Resolution is deterministic string parsing: no I/O, no hooks, no React context.
- Callers pass raw string values from `RoutineExerciseSetReference` and `RoutineExercise.targetRir`; the functions parse and return numbers or defaults.
- Testable independently from the main suggestion formula.

---

## 2. Module Design

### 2.1 `src/domain/suggestions.ts` — Pure computation

```ts
// ─── Types ───────────────────────────────────────────

export type SuggestionAction = "SUBIR" | "MANTENER" | "BAJAR";

export interface WeightSuggestion {
  action: SuggestionAction;
  suggestedWeightKg: number;
  lastSetWeightKg: number;
}

export interface SuggestionInput {
  // The just-completed set (parsed numeric values)
  lastSet: {
    weightKg: number;
    reps: number; // raw reps (clamping applied inside formula)
    actualRir: number;
  };
  // Resolved target values
  targetRepsEff: number; // post-resolution effective reps target
  targetRir: number; // post-resolution effective RIR target (must be present)
}

// ─── Exported pure functions ─────────────────────────

/** Compute weight suggestion. Returns null when any input is invalid. */
export function getWeightSuggestion(
  input: SuggestionInput,
): WeightSuggestion | null;

/** Clamp reps to [5, 15] for Epley formula. */
export function clampEffectiveReps(reps: number): number;

/** Round to the nearest 1.25 kg increment. */
export function roundToNearest125(kg: number): number;

/** Resolve effective target reps from a per-set repsTarget string.
 *  Parses `^\d+(-\d+)?$`, takes midpoint if range, defaults to 8. */
export function resolveEffectiveTargetReps(
  repsTarget: string | undefined,
): number;

/** Resolve target RIR: per-set wins, then exercise-level.
 *  Parses single-digit integer from string, returns null if unparseable. */
export function resolveRirTarget(
  setRirTarget: string | undefined,
  exerciseTargetRir: number | null,
): number | null;
```

**Core formula (from REQ-1 through REQ-3):**

```
e1RM = lastSetWeight × (1 + MIN(MAX(lastSetReps, 5), 15) / 30)
rawSuggested = e1RM / (1 + targetRepsEff / 30) × (1 − 0.025 × targetRir)
rounded = Math.round(rawSuggested / 1.25) × 1.25
action = classify(rounded − lastSetWeight)
```

**Classification thresholds (REQ-5, REQ-6, REQ-7):**

```
delta >= +1.25  → SUBIR
delta <= -1.25  → BAJAR
|delta| < 1.25  → MANTENER
```

### 2.2 `src/features/session/WeightSuggestionBadge.tsx` — UI component

```tsx
interface WeightSuggestionBadgeProps {
  suggestion: WeightSuggestion;
}

export function WeightSuggestionBadge({
  suggestion,
}: WeightSuggestionBadgeProps) {
  // Renders: 💡 SUBIR a ~72.5 kg  (green)
  //          💡 MANTENER en ~70 kg (blue)
  //          💡 BAJAR a ~67.5 kg   (amber)
}
```

**Placeholder sizing:** The badge container reserves a `min-height` (e.g., 44px) to prevent layout shift when appearing/disappearing (REQ-30). CSS class: `.track-suggestion-badge`.

### 2.3 Integration into `WorkoutSessionForm`

Modifications to `WorkoutSessionScreen.tsx` (single file, ~40 lines added):

1. **Import** `getWeightSuggestion`, `resolveEffectiveTargetReps`, `resolveRirTarget` from `../../domain/suggestions`
2. **Add `useMemo`** that produces `Map<string, WeightSuggestion>` keyed by `${exerciseIndex}:${setIndex}`:

```ts
const suggestions = useMemo(() => {
  const result = new Map<string, WeightSuggestion>();
  for (let eIdx = 0; eIdx < exerciseDrafts.length; eIdx++) {
    const exercise = selection.day.exercises[eIdx];
    const draft = exerciseDrafts[eIdx];
    if (!exercise || !draft) continue;

    const exerciseTargetRir = exercise.targetRir;

    for (let sIdx = 1; sIdx < draft.sets.length; sIdx++) {
      // Skip last set (REQ-11) and first set (REQ-12)
      if (sIdx === draft.sets.length - 1) continue;

      const prevSet = draft.sets[sIdx - 1];
      const nextSet = draft.sets[sIdx];

      // REQ-9: badge hidden if next set already has input
      if (nextSet && (nextSet.weightKg || nextSet.reps || nextSet.actualRir))
        continue;

      const weight = parseSessionNumericInput(prevSet.weightKg);
      const reps = parseSessionNumericInput(prevSet.reps);
      const actualRir = parseSessionNumericInput(prevSet.actualRir);

      // REQ-8: all three must be present
      if (weight === null || reps === null || actualRir === null) continue;

      const setRef = exercise.setReferences?.[sIdx];
      const targetRir = resolveRirTarget(setRef?.rirTarget, exerciseTargetRir);

      // REQ-10: no suggestion when targetRir is null
      if (targetRir === null) continue;

      const targetRepsEff = resolveEffectiveTargetReps(setRef?.repsTarget);

      const suggestion = getWeightSuggestion({
        lastSet: { weightKg: weight, reps, actualRir },
        targetRepsEff,
        targetRir,
      });

      if (suggestion) {
        result.set(`${eIdx}:${sIdx}`, suggestion);
      }
    }
  }
  return result;
}, [exerciseDrafts, selection]);
```

3. **Render badge** inside the `.track-set-stack` map, after each set row:

```tsx
{
  exerciseDraft.sets.map((set, setIndex) => (
    <React.Fragment key={`${exercise.id}:set-${setIndex + 1}`}>
      <div className="track-set-grid">{/* existing set row */}</div>
      {suggestions.get(`${exerciseIndex}:${setIndex}`) && (
        <WeightSuggestionBadge
          suggestion={suggestions.get(`${exerciseIndex}:${setIndex}`)!}
        />
      )}
    </React.Fragment>
  ));
}
```

---

## 3. Sequence Diagram

```
┌──────────┐     ┌────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  User    │     │ WorkoutSession │     │ suggestions.ts   │     │WeightSuggestionBadge│
│          │     │     Form       │     │  (pure functions)│     │    (inline UI)      │
└────┬─────┘     └───────┬────────┘     └────────┬─────────┘     └──────────┬──────────┘
     │                   │                       │                          │
     │  type in set 1    │                       │                          │
     │  (weight, reps,   │                       │                          │
     │   RIR)            │                       │                          │
     │──────────────────►│                       │                          │
     │                   │                       │                          │
     │                   │  onChange → setState  │                          │
     │                   │  (exerciseDrafts)     │                          │
     │                   │────────┐              │                          │
     │                   │        │ re-render    │                          │
     │                   │◄───────┘              │                          │
     │                   │                       │                          │
     │                   │  useMemo recalculates │                          │
     │                   │──────────────────────►│                          │
     │                   │                       │                          │
     │                   │  for set[0] (complete)│                          │
     │                   │  ──────────────────►  │                          │
     │                   │    parseSessionNumeric│                          │
     │                   │    Input per field    │                          │
     │                   │  ◄──────────────────  │                          │
     │                   │                       │                          │
     │                   │  resolveRirTarget(    │                          │
     │                   │    setRef?.rirTarget, │                          │
     │                   │    exercise.targetRir)│                          │
     │                   │──────────────────────►│                          │
     │                   │  ◄────── number|null  │                          │
     │                   │                       │                          │
     │                   │  resolveEffective     │                          │
     │                   │  TargetReps(          │                          │
     │                   │    setRef?.repsTarget)│                          │
     │                   │──────────────────────►│                          │
     │                   │  ◄────── number (8 if │                          │
     │                   │          unparseable) │                          │
     │                   │                       │                          │
     │                   │  getWeightSuggestion({│                          │
     │                   │    lastSet:{w,r,rir}, │                          │
     │                   │    targetRepsEff,     │                          │
     │                   │    targetRir          │                          │
     │                   │  })                   │                          │
     │                   │──────────────────────►│                          │
     │                   │                       │                          │
     │                   │                       │  clamp reps [5,15]       │
     │                   │                       │  e1RM = w*(1+effReps/30) │
     │                   │                       │  raw = e1RM/(1+tReps/30) │
     │                   │                       │        *(1-0.025*tRir)   │
     │                   │                       │  round to 1.25 kg        │
     │                   │                       │  classify delta           │
     │                   │                       │────┐                     │
     │                   │                       │    │                     │
     │                   │                       │◄───┘                     │
     │                   │  ◄── WeightSuggestion  │                          │
     │                   │     | null             │                          │
     │                   │                       │                          │
     │                   │  suggestion !== null   │                          │
     │                   │  AND nextSet inputs    │                          │
     │                   │  are empty             │                          │
     │                   │──────────────────────────────────────────────────►│
     │                   │                       │                          │
     │  sees badge:      │                       │                          │
     │  💡 SUBIR ~72.5   │◄──────────────────────────────────────────────────│
     │◄──────────────────│                       │                          │
     │                   │                       │                          │
     │  types in set 2   │                       │                          │
     │  weight field     │                       │                          │
     │──────────────────►│                       │                          │
     │                   │  onChange → setState  │                          │
     │                   │  nextSet.weightKg     │                          │
     │                   │  is now non-empty     │                          │
     │                   │────────┐              │                          │
     │                   │        │ re-render    │                          │
     │                   │◄───────┘              │                          │
     │                   │                       │                          │
     │                   │  useMemo: nextSet     │                          │
     │                   │  has input → skip     │                          │
     │                   │  suggestion = null    │                          │
     │                   │                       │                          │
     │  badge disappears │                       │                          │
     │◄──────────────────│                       │                          │
     │                   │                       │                          │
```

---

## 4. Component Tree

```
WorkoutSessionScreen
└── WorkoutSessionForm
    ├── PageSection
    ├── Card (track-workout-hero)        ← session stats + note
    ├── <status / error banners>
    └── div.track-workout-stack
        └── Card (track-exercise-card)   ← per exercise
            ├── div.track-exercise-card__header
            │   ├── h3 (exercise name)
            │   ├── p (target sets · RIR)
            │   └── span (N sets badge)
            ├── div.track-set-grid--head  ← column labels
            ├── div.track-note-callout    ← previous exercise note (optional)
            └── div.track-set-stack
                ├── div.track-set-grid   ← Set 1 row (inputs)
                ├── WeightSuggestionBadge ← NEW: between Set 1 and Set 2
                │   (💡 SUBIR a ~72.5 kg)   (conditionally rendered)
                ├── div.track-set-grid   ← Set 2 row (inputs)
                ├── WeightSuggestionBadge ← NEW: between Set 2 and Set 3
                ├── div.track-set-grid   ← Set 3 row (last set, no badge after)
                └── FieldTextarea        ← exercise quick note
```

**Key:** `WeightSuggestionBadge` is only rendered when:

- The preceding set is fully logged (weight, reps, RIR all parse to numbers)
- The following set exists and is not the last set
- The following set has all-empty inputs (badge disappears on first keystroke)
- `targetRir` can be resolved (per-set or exercise-level)

---

## 5. File Changes

| File                                             | Action | LoC est. | Notes                                      |
| ------------------------------------------------ | ------ | -------- | ------------------------------------------ |
| `src/domain/suggestions.ts`                      | CREATE | ~90      | Pure computation + target resolution       |
| `src/domain/suggestions.test.ts`                 | CREATE | ~200     | 15+ test cases covering SC-1 through SC-22 |
| `src/features/session/WeightSuggestionBadge.tsx` | CREATE | ~30      | Badge component                            |
| `src/features/session/WorkoutSessionScreen.tsx`  | MODIFY | +40      | useMemo + badge rendering in set-stack     |
| `src/styles/global.css`                          | MODIFY | +40      | `.track-suggestion-badge` styles           |

**No changes to:**

- `src/domain/sessions.ts` — existing session types and parsers are imported, not modified
- `src/domain/routines.ts` — routine types already provide `targetRir` and `setReferences`
- `src/features/session/sessionRepository.ts` — no persistence changes needed
- `src/db/database.ts` — no schema changes

---

## 6. CSS: Badge Styles

```css
.track-suggestion-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  min-height: 44px; /* REQ-30: prevent layout shift */
  border-radius: 12px;
  font-size: 0.92rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
}

.track-suggestion-badge--subir {
  color: #4ade80; /* green */
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.08);
}

.track-suggestion-badge--mantener {
  color: #60a5fa; /* blue */
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(96, 165, 250, 0.08);
}

.track-suggestion-badge--bajar {
  color: #fbbf24; /* amber */
  border-color: rgba(251, 191, 36, 0.3);
  background: rgba(251, 191, 36, 0.08);
}

.track-suggestion-badge__icon {
  font-size: 1.1rem;
}

.track-suggestion-badge__text {
  flex: 1;
}
```

Design follows existing `.track-*` naming convention and uses `var(--design-*)` tokens where available.

---

## 7. Test Plan

### Unit tests: `src/domain/suggestions.test.ts`

| Test ID | Scenario | What it validates                                     |
| ------- | -------- | ----------------------------------------------------- |
| UT-1    | SC-1     | SUBIR when actualRir < targetRir, rounded to 1.25 kg  |
| UT-2    | SC-2     | BAJAR when actualRir > targetRir, rounded to 1.25 kg  |
| UT-3    | SC-3     | MANTENER when actualRir ≈ targetRir (within ±1.25 kg) |
| UT-4    | SC-4     | SUBIR with significant gap (large delta)              |
| UT-5    | SC-5     | Null weight → returns null                            |
| UT-6    | SC-6     | Null reps → returns null                              |
| UT-7    | SC-7     | Null actualRir → returns null                         |
| UT-8    | SC-8     | Null targetRir → returns null                         |
| UT-9    | SC-11    | Rounds up to nearest 1.25 kg                          |
| UT-10   | SC-12    | Rounds down to nearest 1.25 kg                        |
| UT-11   | SC-13    | Already at boundary stays unchanged                   |
| UT-12   | SC-14    | Exact midpoint rounds up                              |
| UT-13   | SC-15    | Delta < 1.25 → MANTENER (even if slight positive)     |
| UT-14   | SC-16    | Reps=3 clamped to 5                                   |
| UT-15   | SC-17    | Reps=20 clamped to 15                                 |
| UT-16   | SC-20    | Range repsTarget "8-10" → midpoint 9                  |
| UT-17   | SC-21    | Unparseable repsTarget → default 8                    |
| UT-18   | SC-22    | Empty repsTarget → default 8                          |
| UT-19   | SC-30    | Idempotency: two calls return same result             |

### Integration tests: `WorkoutSessionScreen.test.tsx` (or new test file)

| Test ID | Scenario | What it validates                                 |
| ------- | -------- | ------------------------------------------------- |
| IT-1    | SC-23    | Badge appears after complete set log between rows |
| IT-2    | SC-24    | Badge disappears when user types in next set      |
| IT-3    | SC-25    | No badge before first set is logged               |
| IT-4    | SC-26    | No badge after last set                           |
| IT-5    | SC-27    | Inputs remain empty (not pre-filled)              |

### Non-functional validation

| Check           | How                                       |
| --------------- | ----------------------------------------- |
| SC-28 (< 1 ms)  | Timer wrapper in test or manual benchmark |
| SC-29 (offline) | Manual verification on PWA                |
| Regression      | `npm run test:run` passes unchanged       |
| Lint/Typecheck  | `npm run lint && npm run typecheck`       |

---

## 8. Rollout Plan

1. **Phase: Foundation** — Create `src/domain/suggestions.ts` + tests. No UI changes.
2. **Phase: UI** — Add `WeightSuggestionBadge` component + integration into `WorkoutSessionForm` + CSS. Add integration tests.
3. **Phase: Polish** — Verify all 30 scenarios, fix edge cases, run full test suite.

**Rollback:** Remove the 5 files listed in §5, revert `WorkoutSessionScreen.tsx` changes. No database migration needed. Feature is purely additive.

---

## 9. Risks & Mitigations

| Risk                                                                                                          | Severity | Mitigation                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `useMemo` dependencies miss a case causing stale suggestions                                                  | Medium   | Use exhaustive dependency array (`exerciseDrafts`, `selection`); integration test covers typing scenarios          |
| Rounding near zero delta producing flickering SUBIR/BAJAR                                                     | Low      | The ±1.25 kg MANTENER threshold (REQ-7) creates a dead zone; test edge cases at exactly ±1.249                     |
| Performance on exercises with 10+ sets                                                                        | Low      | Algorithm is O(sets × exercises); typical workout is 5-10 exercises × 3-5 sets = 50 iterations max, each < 0.02 ms |
| Mobile layout shift (REQ-30)                                                                                  | Medium   | `min-height: 44px` on badge container ensures reserved space; test on 375px viewport                               |
| `parseSessionNumericInput(prevSet.weightKg)` returns null for empty string but field uses `""` (empty string) | Low      | This is the correct behavior: empty string → null → no suggestion, which matches REQ-9                             |

---

## 10. Skill Resolution

- **Project Standards:** `injected` — parent delivered compact rules via prompt
- **Executor phase skill:** `sdd-design` (assigned by parent)
