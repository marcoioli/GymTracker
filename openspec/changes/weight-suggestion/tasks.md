# Weight Suggestion – Implementation Tasks

**Change:** `weight-suggestion`
**Phase:** tasks
**Started:** 2026-05-14
**Status:** draft

---

## Review Workload Forecast

| Field                   | Value                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Estimated changed lines | ~490 (290 foundation + 200 UI)                                                       |
| 400-line budget risk    | **High** — exceeds threshold by ~90 lines                                            |
| Chained PRs recommended | **Yes**                                                                              |
| Suggested split         | PR 1: Foundation (domain + tests) → PR 2: UI (badge, screen, CSS, integration tests) |
| Delivery strategy       | auto-chain                                                                           |
| Chain strategy          | feature-branch-chain                                                                 |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

### Why High Risk

| Signal                 | Detail                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------- |
| File count             | 6 files (3 create, 3 modify)                                                        |
| Test surface           | 19 unit tests + 5 integration tests                                                 |
| Cross-cutting          | Domain layer → feature layer → CSS                                                  |
| Integration complexity | `useMemo` dependency array correctness; DOM placement between set rows              |
| Existing test suite    | `WorkoutSessionScreen.test.tsx` has 3 tests; adding 5 more requires careful seeding |

### Chain Breakdown

| PR       | Contents                                                                                              | Lines | Autonomous?                                              |
| -------- | ----------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------- |
| **PR 1** | `suggestions.ts` + `suggestions.test.ts`                                                              | ~290  | ✅ Self-contained, zero UI deps, CI passes independently |
| **PR 2** | `WeightSuggestionBadge.tsx` + `WorkoutSessionScreen.tsx` mods + `global.css` mods + integration tests | ~200  | ✅ Builds on PR 1's exports, no circular deps            |

**Rollback:** Remove the 6 files/changes listed above. No database migration needed. Feature is purely additive.

---

## Task List

### Phase 1: Foundation — PR 1 (domain layer only)

#### Task 1.1 — Create `src/domain/suggestions.ts`: core computation module

**Files touched:** `src/domain/suggestions.ts` (CREATE, ~90 lines)

**What to implement:**

- `SuggestionAction` type (`"SUBIR" | "MANTENER" | "BAJAR"`)
- `WeightSuggestion` interface: `{ action, suggestedWeightKg, lastSetWeightKg }`
- `SuggestionInput` interface: `{ lastSet: { weightKg, reps, actualRir }, targetRepsEff, targetRir }`
- `getWeightSuggestion(input: SuggestionInput): WeightSuggestion | null`
  - Epley e1RM → reverse Epley with RIR discount → 1.25 kg rounding → classification
  - Returns `null` when any input is invalid, missing, or `targetRir` is null
- `clampEffectiveReps(reps: number): number` — clamp to `[5, 15]`
- `roundToNearest125(kg: number): number` — `Math.round(kg / 1.25) * 1.25`
- `resolveEffectiveTargetReps(repsTarget: string | undefined): number`
  - Parse `^\d+(-\d+)?$`; midpoint `Math.round((lo + hi) / 2)` for ranges; default `8`
- `resolveRirTarget(setRirTarget: string | undefined, exerciseTargetRir: number | null): number | null`
  - Per-set wins when parseable; exercise-level fallback; `null` when both absent

**Core formula (REQ-1 through REQ-7):**

```
effectiveReps = clamp(lastSet.reps, 5, 15)
e1RM = lastSet.weightKg × (1 + effectiveReps / 30)
rawSuggested = e1RM / (1 + targetRepsEff / 30) × (1 − 0.025 × targetRir)
rounded = Math.round(rawSuggested / 1.25) × 1.25
delta = rounded − lastSet.weightKg
delta >= +1.25 → SUBIR   |   delta <= −1.25 → BAJAR   |   |delta| < 1.25 → MANTENER
```

**Imports:** None from React or UI. Pure TypeScript only. Zero dependencies.

**Acceptance:** file compiles cleanly (`npx tsc --noEmit`), all functions are exported.

**Estimated lines:** ~90

---

#### Task 1.2 — Create `src/domain/suggestions.test.ts`: 19 unit tests

**Files touched:** `src/domain/suggestions.test.ts` (CREATE, ~200 lines)

**Test ID → Scenario mapping (19 tests):**

| #   | Test ID | Scenario | What it validates                      | Input sketch                          |
| --- | ------- | -------- | -------------------------------------- | ------------------------------------- |
| 1   | UT-1    | SC-1     | SUBIR when actualRir < targetRir       | w=70, r=8, aRir=3, tRir=2, tReps=8    |
| 2   | UT-2    | SC-2     | BAJAR when actualRir > targetRir       | w=70, r=8, aRir=4, tRir=2, tReps=8    |
| 3   | UT-3    | SC-3     | MANTENER when actualRir ≈ targetRir    | w=70, r=8, aRir=2, tRir=2, tReps=8    |
| 4   | UT-4    | SC-4     | SUBIR with large gap                   | w=50, r=10, aRir=3, tRir=1, tReps=8   |
| 5   | UT-5    | SC-5     | Null when weight missing               | weight=null                           |
| 6   | UT-6    | SC-6     | Null when reps missing                 | reps=null                             |
| 7   | UT-7    | SC-7     | Null when actualRir missing            | actualRir=null                        |
| 8   | UT-8    | SC-8     | Null when targetRir is null            | targetRir=null                        |
| 9   | UT-9    | SC-11    | Round up to 1.25 kg                    | rawSuggested=71.3 → 71.25             |
| 10  | UT-10   | SC-12    | Round down to 1.25 kg                  | rawSuggested=71.8 → 72.5 (Math.round) |
| 11  | UT-11   | SC-13    | Already at boundary                    | rawSuggested=72.5 → 72.5              |
| 12  | UT-12   | SC-14    | Exact midpoint rounds up               | rawSuggested=71.875 → 72.5            |
| 13  | UT-13   | SC-15    | Delta < 1.25 → MANTENER                | computed delta < 1.25 after rounding  |
| 14  | UT-14   | SC-16    | Reps=3 clamped to 5                    | w=100, reps=3, clamped→5              |
| 15  | UT-15   | SC-17    | Reps=20 clamped to 15                  | w=40, reps=20, clamped→15             |
| 16  | UT-16   | SC-20    | Range repsTarget "8-10" → 9            | midpoint of range                     |
| 17  | UT-17   | SC-21    | Unparseable → default 8                | "8 a 10" → 8                          |
| 18  | UT-18   | SC-22    | Empty string → default 8               | "" → 8                                |
| 19  | UT-19   | SC-30    | Idempotency: same inputs → same output | call twice, assert identical          |

**Additional tests for `resolveRirTarget`:**

- SC-18: per-set `rirTarget="1"` wins over exercise `targetRir=3`
- SC-19: falls back to exercise `targetRir=2` when per-set is absent
- Edge: per-set `rirTarget=""` → falls back to exercise-level
- Edge: both per-set and exercise are null → returns null

(These can be folded into existing test cases or added as separate `describe` blocks.)

**Test runner:** `npx vitest run src/domain/suggestions.test.ts`

**Acceptance:** All 19+ tests pass green. Run `npm run typecheck` — no errors.

**Estimated lines:** ~200

---

### Phase 2: UI Integration — PR 2 (builds on PR 1)

#### Task 2.1 — Create `WeightSuggestionBadge` component

**Files touched:** `src/features/session/WeightSuggestionBadge.tsx` (CREATE, ~30 lines)

**What to implement:**

- `WeightSuggestionBadgeProps`: `{ suggestion: WeightSuggestion }`
- Renders: `💡` icon + action verb + `"a ~X kg"` (SUBIR) / `"en ~X kg"` (MANTENER) / `"a ~X kg"` (BAJAR)
- CSS class: `.track-suggestion-badge` + modifier class (`.track-suggestion-badge--subir`, `--mantener`, `--bajar`)
- Structure: `<div className={badgeClass}><span className="track-suggestion-badge__icon">💡</span><span className="track-suggestion-badge__text">...</span></div>`

**Dependencies:** Imports `WeightSuggestion` from `../../domain/suggestions`

**Acceptance:** Component renders without crash. `npm run typecheck` passes.

**Estimated lines:** ~30

---

#### Task 2.2 — Add suggestion `useMemo` to `WorkoutSessionForm`

**Files touched:** `src/features/session/WorkoutSessionScreen.tsx` (MODIFY, ~45 lines added)

**What to implement:**

1. **Import** `getWeightSuggestion`, `resolveEffectiveTargetReps`, `resolveRirTarget` from `../../domain/suggestions`
2. **Import** `parseSessionNumericInput` from `../../domain/sessions` (already imported)
3. **Add `useMemo`** (before the return statement, alongside existing `useMemo` for `selection`):

```ts
const suggestions = useMemo(() => {
  const result = new Map<string, WeightSuggestion>();
  for (let eIdx = 0; eIdx < exerciseDrafts.length; eIdx++) {
    const exercise = selection.day.exercises[eIdx];
    const draft = exerciseDrafts[eIdx];
    if (!exercise || !draft) continue;

    const exerciseTargetRir = exercise.targetRir;

    // Iterate set indices starting from 1 (skip first set, REQ-12)
    for (let sIdx = 1; sIdx < draft.sets.length; sIdx++) {
      // REQ-11: skip last set
      if (sIdx === draft.sets.length - 1) continue;

      const prevSet = draft.sets[sIdx - 1];
      const nextSet = draft.sets[sIdx];

      // REQ-13/REQ-9: badge hidden if next set already has input
      if (nextSet?.weightKg || nextSet?.reps || nextSet?.actualRir) continue;

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

4. **Dependency array:** `[exerciseDrafts, selection]` — exhaustive. These are the only external values read inside the memo.

**Acceptance:** `useMemo` recomputes when a set input changes. No stale suggestions. `npm run typecheck` passes.

**Estimated lines:** ~40 (imports + useMemo block)

---

#### Task 2.3 — Render `WeightSuggestionBadge` between set rows

**Files touched:** `src/features/session/WorkoutSessionScreen.tsx` (MODIFY, ~5 lines added to existing render loop)

**What to implement:**

In the `.track-set-stack` map (around line 319), wrap each set row in a `<React.Fragment>` and conditionally render the badge after it:

```tsx
<div className="track-set-stack">
  {exerciseDraft.sets.map((set, setIndex) => (
    <React.Fragment key={`${exercise.id}:set-${setIndex + 1}`}>
      <div className="track-set-grid">
        {/* existing set row content — no changes */}
      </div>
      {suggestions.get(`${exerciseIndex}:${setIndex}`) && (
        <WeightSuggestionBadge
          suggestion={suggestions.get(`${exerciseIndex}:${setIndex}`)!}
        />
      )}
    </React.Fragment>
  ))}
</div>
```

**What changes:**

- Replace the `key={...}` on the inner `<div className="track-set-grid">` with `key` on the `React.Fragment`
- Add conditional badge rendering after each set row div
- Import `WeightSuggestionBadge` from `./WeightSuggestionBadge`
- `exerciseIndex` is already available in the outer map — use it
- `suggestions` is from the `useMemo` in Task 2.2

**Edge case safeguard:** The `suggestions.get(...)` lookup uses the same key format (`${eIdx}:${sIdx}`) as the `useMemo`. The non-null assertion `!` is safe because we guard with `&&` first.

**Acceptance:** Badge appears between rows when conditions are met (SC-23). Badge disappears when next set gets input (SC-24). No badge before first set (SC-25) or after last set (SC-26). `npm run typecheck` passes.

**Estimated lines:** ~5 (modification to existing map)

---

#### Task 2.4 — Add badge CSS styles

**Files touched:** `src/styles/global.css` (MODIFY, ~45 lines appended after existing track styles)

**What to implement:**

```css
/* ── Weight Suggestion Badge ── */

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
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(74, 222, 128, 0.08);
}

.track-suggestion-badge--mantener {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(96, 165, 250, 0.08);
}

.track-suggestion-badge--bajar {
  color: #fbbf24;
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

**Placement:** Append to `src/styles/global.css` after existing `.track-*` styles (around line 2390). Follow existing naming conventions.

**Acceptance:** Visual check — green badge for SUBIR, blue for MANTENER, amber for BAJAR. Layout stable on 375px viewport (no shift when badge appears/disappears).

**Estimated lines:** ~45

---

#### Task 2.5 — Add integration tests to `WorkoutSessionScreen.test.tsx`

**Files touched:** `src/features/session/WorkoutSessionScreen.test.tsx` (MODIFY, ~80 lines added)

**What to implement:** 5 integration tests using the existing test patterns (vitest + @testing-library/react + MemoryRouter + seeded db):

| #   | Test ID | Scenario | What to validate                                                                                                                                    |
| --- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | IT-1    | SC-23    | Badge appears after complete set log between rows. Seed routine with 3-set exercise, fill Set 1 completely, assert badge renders with correct text. |
| 2   | IT-2    | SC-24    | Badge disappears when user types in next set. Fill Set 1, assert badge visible, start typing in Set 2's weight field, assert badge removed.         |
| 3   | IT-3    | SC-25    | No badge before first set is logged. Render session, assert no badge element in DOM.                                                                |
| 4   | IT-4    | SC-26    | No badge after last set. Fill Set 2 (penultimate), assert no badge for Set 3 position.                                                              |
| 5   | IT-5    | SC-27    | Inputs remain empty (not pre-filled). Fill Set 1, assert badge visible, verify Set 2's weight/reps/RIR inputs are empty.                            |

**Existing test patterns to follow:**

- Use `seedRoutine()` helper (already exists in file) to set up test data
- Use `userEvent` for typing
- Use `screen.getByLabelText` / `screen.queryByText` for assertions
- Mock navigation with `vi.mock("react-router-dom", ...)` (already set up)
- Each test in its own `it()` block within the existing `describe("WorkoutSessionScreen", ...)`

**Note on test data:** You may need to add or modify the seeded routine to include exercises with `targetRir` and `setReferences` containing `rirTarget` and `repsTarget` fields, enabling the suggestion to compute.

**Acceptance:** `npx vitest run src/features/session/WorkoutSessionScreen.test.tsx` — all 8 tests pass (3 existing + 5 new).

**Estimated lines:** ~80

---

### Phase 3: Polish & Verification

#### Task 3.1 — Run full validation suite

**Commands to run:**

```bash
npx vitest run                          # All unit + integration tests
npm run lint                            # ESLint
npm run typecheck                       # TypeScript
```

**What to verify:**

- [ ] All 19 unit tests pass (Task 1.2)
- [ ] All 5 integration tests pass (Task 2.5)
- [ ] All 8 existing tests in `WorkoutSessionScreen.test.tsx` still pass (no regressions)
- [ ] All other existing tests pass (no regressions in `sessions.test.ts`, `routines.test.ts`, `sessionRepository.test.ts`, etc.)
- [ ] Lint: zero warnings
- [ ] Typecheck: zero errors

**Estimated lines:** 0 (no code changes, just execution)

---

#### Task 3.2 — Manual smoke test on mobile viewport

**What to verify manually (in dev server):**

1. Start a workout session (any routine with RIR targets on exercises)
2. Fill Set 1 completely (weight, reps, RIR) → badge appears
3. Badge shows correct action (SUBIR/BAJAR/MANTENER) and rounded weight
4. Start typing in Set 2 → badge disappears immediately
5. Complete Set 2 → badge for Set 3 does NOT appear (last set, REQ-11)
6. Resize to 375px → no layout shift when badge appears/disappears (REQ-30)
7. Fill Set 1 partially → no badge (REQ-9)
8. Test with exercise that has no `targetRir` → no badge (REQ-10)

**Estimated lines:** 0

---

## Dependency Order

```
1.1 (suggestions.ts)
    │
    ▼
1.2 (suggestions.test.ts)
    │
    ▼
 ═══ PR 1 MERGE ═══
    │
    ▼
2.1 (WeightSuggestionBadge.tsx)
    │
    ├──► 2.2 (useMemo in WorkoutSessionScreen.tsx)
    │         │
    │         ▼
    └──► 2.3 (badge rendering in set-stack)
              │
              ▼
         2.4 (global.css)
              │
              ▼
         2.5 (integration tests)
              │
              ▼
         ═══ PR 2 MERGE ═══
              │
              ▼
         3.1 (validation suite)
              │
              ▼
         3.2 (manual smoke test)
```

## Summary

| Phase             | Tasks       | Files                 | Lines    | Tests               |
| ----------------- | ----------- | --------------------- | -------- | ------------------- |
| Foundation (PR 1) | 1.1–1.2     | 2 new                 | ~290     | 19 unit             |
| UI (PR 2)         | 2.1–2.5     | 1 new, 3 modified     | ~200     | 5 integration       |
| Polish            | 3.1–3.2     | 0                     | 0        | validation + manual |
| **Total**         | **9 tasks** | **3 new, 3 modified** | **~490** | **24 tests**        |
