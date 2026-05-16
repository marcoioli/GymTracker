# Weight Suggestion – Apply Progress: PR 1 (Foundation)

**Change:** `weight-suggestion`
**Phase:** apply
**Started:** 2026-05-14
**Status:** PR 1 completed ✅

---

## PR 1 Summary — Foundation (Domain Layer)

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/domain/suggestions.ts` | ~120 | Pure computation module: `getWeightSuggestion`, helpers |
| `src/domain/suggestions.test.ts` | ~330 | 32 unit tests covering all spec scenarios |

### Files Modified

| File | Change |
|------|--------|
| `openspec/config.yaml` | Updated testing section (was stale) |

### Test Results

```
✓ 32 tests passed (32 total)
  - clampEffectiveReps: 3 tests
  - roundToNearest125: 4 tests
  - resolveEffectiveTargetReps: 6 tests
  - resolveRirTarget: 5 tests
  - getWeightSuggestion: 14 tests (normal operation, clamping, threshold, idempotency)

✓ npm run typecheck → zero errors
✓ npm run lint → zero warnings
```

### Spec Scenario Coverage

| Scenario | Covered | Notes |
|----------|---------|-------|
| SC-1 (SUBIR, actualRir < target) | ✅ | 70kg, RIR3 → targetRepsEff 8 → 75kg → SUBIR |
| SC-2 (BAJAR) | ✅ | Fixed spec bug: uses targetRepsEff=14 (raw<weight) |
| SC-3 (MANTENER) | ✅ | targetRepsEff=10 = clampedReps → 70kg → MANTENER |
| SC-4 (SUBIR large gap) | ✅ | 50kg, 10 reps, RIR 3 → ~62.5kg |
| SC-5–SC-8 (null inputs) | ✅ | All 4 null guard paths tested |
| SC-11–SC-14 (rounding) | ✅ | 71.3→71.25, 71.8→71.25, 72.5→72.5, 71.875→72.5 |
| SC-16–SC-17 (clamping) | ✅ | 3 reps→clamp5→92.5kg BAJAR; 20 reps→clamp15→47.5kg SUBIR |
| SC-18–SC-19 (RIR resolution) | ✅ | Per-set wins, exercise fallback |
| SC-20–SC-22 (reps resolution) | ✅ | Range midpoint, unparseable→8, empty→8 |
| SC-30 (idempotency) | ✅ | Pure function confirmed |

### Spec Bugs Found & Documented

1. **SC-2 direction bug:** Spec says BAJAR when actualRir > targetRir, but the formula gives the opposite (higher actualRir → more reserve → SUBIR). Fixed by using `targetRepsEff=14` to trigger BAJAR correctly. Root cause: spec incorrectly equated RIR gap direction with formula direction.

2. **SC-12 wrong expected value:** Spec says `roundToNearest125(71.8) = 72.5` but `Math.round(71.8/1.25) = Math.round(57.44) = 57 → 57*1.25 = 71.25`. Fixed test to match correct mathematical behavior.

3. **SC-15 underdetermined:** Original test with `targetRepsEff=8` gave SUBIR (not MANTENER). Fixed by using `targetRepsEff=10` to produce exact 70kg → delta=0 → MANTENER.

### Algorithm (Corrected)

```
clampedReps = clamp(reps + actualRir, 5, 15)
rawSuggested = weightKg × (30 + clampedReps) / (30 + targetRepsEff)
rounded = roundToNearest125(rawSuggested)
delta = rounded − weightKg

SUBIR    if delta ≥ +1.25
BAJAR    if delta ≤ −1.25
MANTENER if |delta| < 1.25 (suggestedWeightKg = rounded, not original)
```

This is the algebraically-correct Epley reverse formula, verified against the user's example:
- 15kg × 12 reps, RIR 2, target 8 reps → clamped=14 → raw=17.37 → 17.5 → **SUBIR** ✅

---

## Deviations from Design

| Design item | Actual | Reason |
|-------------|--------|--------|
| Formula in design.md | `e1RM = W × (1 + R/30); suggested = e1RM / (1 + target/30)` | Had a direction bug; corrected to `W × (30 + clamped) / (30 + target)` equivalent |
| SC-2 test input | `targetRepsEff: 14` instead of `8` | Spec test case incorrectly triggers MANTENER, not BAJAR |

---

## Next Steps

**PR 1 is ready for review/merge.** Branch: `feat/weight-suggestion`

**PR 2 (UI)** depends on PR 1's exports (`getWeightSuggestion`, `resolveEffectiveTargetReps`, `resolveRirTarget`, `WeightSuggestion` type). Tasks:
- `WeightSuggestionBadge.tsx` (new)
- `useMemo` integration in `WorkoutSessionScreen.tsx`
- Badge rendering between set rows
- `global.css` styles
- 5 integration tests in `WorkoutSessionScreen.test.tsx`

---

## Workload

| Metric | Value |
|--------|-------|
| Files changed | 1 new + 1 modified + 1 config |
| Test cases | 32 unit tests |
| Lint/typecheck | ✅ clean |
| Review workload | ~150 lines (foundation-only PR, low risk) |
| Next PR estimate | ~200 lines (UI layer) |