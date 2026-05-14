# Weight Suggestion – Proposal

**Change:** `weight-suggestion`
**Phase:** proposal
**Started:** 2026-05-14
**Status:** draft

---

## Intent

Display a real-time, inline weight suggestion for the **next set** during an active workout session, computed from the just-logged set using an Epley-based e1RM autoregulation algorithm. The suggestion is a **non-intrusive hint badge** — never an auto-fill — that helps the user decide whether to subir, mantener, or bajar weight for the upcoming set, based on the programmed RIR target.

This is v1: **intra-session only** (uses only the current session's just-logged set, no historical data). Previous-session comparison is deferred to v2.

---

## Scope

### In scope

- A pure, testable suggestion function in `src/domain/suggestions.ts`.
- Three suggestion states: **Subir** (green), **Mantener** (blue), **Bajar** (amber).
- Suggestion appears **after all 3 fields (weight, reps, RIR) have been logged** for a given set.
- Suggestion targets the **immediately next set** of the same exercise.
- No suggestion is shown for the last set of an exercise, nor before any set is fully logged.
- Suggestion **disappears** when the user begins typing in the next set's row.
- RIR target is resolved **per set** via `RoutineExerciseSetReference.rirTarget` when present; falls back to `RoutineExercise.targetRir` when absent.
- Rep target midpoint is resolved **per set** via `RoutineExerciseSetReference.repsTarget` when parseable; falls back to a default midpoint of **8** when absent or unparseable.
- Weight is rounded to the nearest **1.25 kg** increment. Minimum suggested delta is ±1.25 kg. If the computed delta is less than 1.25 kg, the suggestion is **Mantener**.
- Effective reps are **capped internally at [5, 15]** before computing e1RM, guarding against formula breakdown at extremes.

### Out of scope (v1)

- Previous-session comparison or historical trend data.
- Multi-set averaging (e.g., "average of all completed sets so far").
- Auto-fill or one-tap-apply of the suggested weight.
- Suggestion for the first set of an exercise (no prior logged set exists).
- Suggestions on the finish/end-early screen.

---

## Affected Areas

| Area                       | File                                                 | Change                                                                             |
| -------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **New: suggestion domain** | `src/domain/suggestions.ts`                          | Pure `getWeightSuggestion()` function and Epley helpers                            |
| **New: suggestion tests**  | `src/domain/suggestions.test.ts`                     | Unit tests covering all algorithm states and edge cases                            |
| **Session UI**             | `src/features/session/WorkoutSessionScreen.tsx`      | Add suggestion badge between set rows; wire into `exerciseDrafts` state            |
| **Session UI tests**       | `src/features/session/WorkoutSessionScreen.test.tsx` | Test suggestion appearance and disappearance                                       |
| **SDD config**             | `openspec/config.yaml`                               | Update `testing.test_runner` and `testing.layers.unit` with correct vitest details |

### Not affected

- `src/domain/routines.ts` — no changes to `RoutineExerciseSetReference` or normalization.
- `src/domain/sessions.ts` — no changes to session types or parsing.
- `src/features/session/sessionRepository.ts` — no changes to save/load flow.
- `src/db/database.ts` — no schema changes.

---

## Architecture Decisions

### AD1: Epley formula for e1RM

**Choice:** e1RM = `weight × (1 + reps / 30)` (Epley), capped to `effectiveReps ∈ [5, 15]`.

**Rationale:** Epley is well-established and simple. Capping guards against formula inaccuracy at very low (<5) and very high (>15) rep counts, which are atypical for GymTracker’s target audience (strength/hypertrophy).

### AD2: Per-set targets from RoutineExerciseSetReference

**Choice:** Extract `rirTarget` and `repsTarget` from `RoutineExerciseSetReference` indexed by set number. When the field is absent, empty, or unparseable, fall back to `RoutineExercise.targetRir` (for RIR) or a default rep midpoint of 8 (for reps).

**Rationale:** GymTracker already stores per-set target strings. Using them honors the routine author's intent. The fallback chain ensures graceful degradation for routines created without per-set detail.

### AD3: Rounding to 1.25 kg

**Choice:** `Math.round(kg / 1.25) * 1.25`. Minimum suggested delta of ±1.25 kg.

**Rationale:** 1.25 kg is the smallest practical plate increment in most gyms (pair of 1.25 kg plates = 2.5 kg total on a barbell, but dumbbells and machines often step in 1.25 kg). A smaller delta would produce noise; a larger delta (2.5 kg) would miss usable intermediate steps.

### AD4: Hint-only, not auto-fill

**Choice:** Display a colored badge with a descriptive verb and suggested weight. Do not modify input values.

**Rationale:** The user retains full control. Auto-fill would be opinionated and error-prone. A hint respects the human-in-the-loop principle of GymTracker: the app suggests, the athlete decides.

### AD5: Suggestion disappears on user input

**Choice:** When the user begins typing in the next set's row, the suggestion badge is removed from the DOM.

**Rationale:** Once the user commits to a direction (by typing), the suggestion has served its purpose. Keeping it visible would be visual clutter.

---

## Algorithm Summary

```
function getWeightSuggestion(lastSet, targetReps, targetRir):
  if lastSet is incomplete (weight, reps, or RIR null): return null
  if targetRir is null: return null  // can't calculate without a target

  e1RM = lastSet.weight × (1 + effectiveReps / 30)
  targetRepsEff = if targetReps available then targetReps else 8
  suggestedWeight = e1RM / (1 + targetRepsEff / 30) × (1 - 0.025 × targetRir)
  suggestedWeight = roundToNearest1_25(suggestedWeight)

  delta = suggestedWeight - lastSet.weight

  if |delta| < 1.25: return { action: "MANTENER", weight: suggestedWeight }
  if delta > 0:     return { action: "SUBIR",    weight: suggestedWeight }
  else:              return { action: "BAJAR",    weight: suggestedWeight }
```

Where `effectiveReps = clamp(lastSet.reps, 5, 15)`.

---

## UI Placement

The suggestion badge appears as an inline chip **between** the completed set row and the next set row inside the `.track-set-stack` div. Visual layout:

```
┌─────────────────────────────────────┐
│  Set 1  │ Prev  │ 70 kg │ 8  │ 2   │  ← logged row
├─────────────────────────────────────┤
│  💡 SUBIR a ~72.5 kg                │  ← suggestion badge (green chip)
├─────────────────────────────────────┤
│  Set 2  │ Prev  │ [   ] │ [ ] │ [ ] │  ← next row (empty, ready for input)
└─────────────────────────────────────┘
```

No suggestion appears after the last set.

---

## Risks and Mitigations

| Risk                                                                | Severity | Mitigation                                                                                                |
| ------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| String parsing fragility for `repsTarget` ("8-10", "8 a 10", empty) | Medium   | Strict parser: only `^\d+(-\d+)?$` accepted. Null on any other format. Fallback to default midpoint of 8. |
| Epley accuracy degrades outside 5-15 reps                           | Low      | Clamp effective reps to [5, 15] before computing e1RM.                                                    |
| `targetRir` may be null for exercises without programmed RIR        | Medium   | Skip suggestion entirely when targetRir is null (return null).                                            |
| Suggestion badge may cause layout shift on mobile                   | Low      | Reserve vertical space in grid; use `min-height` on badge container.                                      |
| No existing tests for suggestion logic                              | Low      | New `suggestions.test.ts` with 15+ cases before UI integration.                                           |
| `openspec/config.yaml` is stale (claims no test runner)             | Low      | Fix during proposal phase or apply phase.                                                                 |

---

## Rollback Plan

1. The suggestion function is a pure import. Removing the import and the badge `<div>` from `WorkoutSessionScreen.tsx` reverts the feature.
2. No database migrations, no state shape changes.
3. If the suggestion badge causes mobile layout issues in production, the UI change can be reverted independently from the domain logic.
4. The new `src/domain/suggestions.ts` file can remain in-tree without side effects if unused.

---

## Success Criteria

1. **Algorithm correctness:** When a user logs weight=70 kg, reps=8, actualRir=2, and the target is RIR=2 with 8-rep midpoint → suggests **Mantener ~70 kg** (delta < 1.25 kg).
2. **Subir:** When actualRir < target (user had reps in reserve) → suggests higher weight.
3. **Bajar:** When actualRir > target (user was closer to failure than planned) → suggests lower weight.
4. **No suggestion** when any required field is missing (incomplete set).
5. **No suggestion** when targetRir is null.
6. **No suggestion** for the last set of an exercise.
7. **Suggestion disappears** when user starts typing in the next row.
8. **Rounding** to 1.25 kg holds for all computed weights.
9. **All suggestion tests pass** (`vitest run src/domain/suggestions.test.ts`).
10. **Existing session tests continue to pass** (no regressions in `WorkoutSessionScreen.test.tsx`).

---

## Open Questions Resolved

From the explore phase, the following decisions are formalized here:

1. **Rounding:** ✅ Nearest 1.25 kg. Minimum delta ±1.25 kg.
2. **Data source v1:** ✅ Most recent set only (not average of all completed sets).
3. **Set 1:** ✅ No suggestion before any set is logged.
4. **Suggestion disappearance:** ✅ Cleared when user starts typing next set.
5. **Missing targets:** ✅ Skip suggestion entirely.
6. **Hint vs auto-fill:** ✅ Hint-only, three states (Subir/Mantener/Bajar).

---

## Next Phase

`spec` — formalize behavior with Given/When/Then scenarios covering all algorithm states, UI visibility rules, and edge cases.
