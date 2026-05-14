# Weight Suggestion – Spec

**Change:** `weight-suggestion`
**Phase:** spec
**Started:** 2026-05-14
**Status:** draft

---

## 1. Functional Requirements

### 1.1 Suggestion Computation

| ID        | Requirement                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------- |
| **REQ-1** | The system SHALL compute a weight suggestion using the Epley e1RM formula: `e1RM = weight × (1 + effectiveReps / 30)`.          |
| **REQ-2** | The system MUST clamp `effectiveReps` to the range `[5, 15]` before computing e1RM, regardless of the actual logged rep count.  |
| **REQ-3** | The system SHALL derive the suggested weight as: `suggestedWeight = e1RM / (1 + targetRepsEff / 30) × (1 − 0.025 × targetRir)`. |
| **REQ-4** | The system MUST round the suggested weight to the nearest 1.25 kg increment using `Math.round(kg / 1.25) * 1.25`.               |
| **REQ-5** | The system SHALL classify the suggestion as **SUBIR** when `suggestedWeight − lastSet.weight ≥ 1.25`.                           |
| **REQ-6** | The system SHALL classify the suggestion as **BAJAR** when `suggestedWeight − lastSet.weight ≤ −1.25`.                          |
| **REQ-7** | The system SHALL classify the suggestion as **MANTENER** when `                                                                 | suggestedWeight − lastSet.weight | < 1.25`. |

### 1.2 Suggestion Visibility

| ID         | Requirement                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **REQ-8**  | The system SHALL display a weight suggestion badge **only after** all three fields (weight, reps, RIR) of a set have been fully logged. |
| **REQ-9**  | The system MUST NOT display a suggestion badge when the just-logged set has any null or incomplete field (weight, reps, or RIR).        |
| **REQ-10** | The system MUST NOT display a suggestion badge when the exercise's resolved `targetRir` is null.                                        |
| **REQ-11** | The system MUST NOT display a suggestion badge after the last set of an exercise.                                                       |
| **REQ-12** | The system MUST NOT display a suggestion badge for the first set of an exercise (no prior logged set exists).                           |
| **REQ-13** | The system MUST remove the suggestion badge from the DOM when the user begins typing in the next set's input fields.                    |
| **REQ-14** | The suggestion badge SHALL target the immediately next set of the same exercise.                                                        |

### 1.3 Target Resolution

| ID         | Requirement                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **REQ-15** | The system SHALL resolve `rirTarget` per set via `RoutineExerciseSetReference.rirTarget` when present and parseable.                             |
| **REQ-16** | When per-set `rirTarget` is absent or unparseable, the system SHALL fall back to `RoutineExercise.targetRir`.                                    |
| **REQ-17** | When exercise-level `targetRir` is also null, the system SHALL NOT show a suggestion (per REQ-10).                                               |
| **REQ-18** | The system SHALL resolve `repsTarget` per set via `RoutineExerciseSetReference.repsTarget` when present and matching the pattern `^\d+(-\d+)?$`. |
| **REQ-19** | When per-set `repsTarget` is absent or unparseable, the system SHALL fall back to a default midpoint of 8.                                       |
| **REQ-20** | For range-format `repsTarget` strings (e.g., `"8-10"`), the system SHALL compute the midpoint as `Math.round((low + high) / 2)`.                 |

### 1.4 UI Presentation

| ID         | Requirement                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REQ-21** | The suggestion badge SHALL be a colored inline chip displaying a lightbulb icon (💡), the action verb (Subir/Mantener/Bajar), and the suggested weight (e.g., `💡 SUBIR a ~72.5 kg`). |
| **REQ-22** | The SUBIR badge SHALL use a green color.                                                                                                                                              |
| **REQ-23** | The MANTENER badge SHALL use a blue color.                                                                                                                                            |
| **REQ-24** | The BAJAR badge SHALL use an amber color.                                                                                                                                             |
| **REQ-25** | The suggestion badge MUST NOT modify or pre-fill any input field values.                                                                                                              |
| **REQ-26** | The suggestion badge SHALL be placed between the completed set row and the next set row inside the `.track-set-stack` container.                                                      |

### 1.5 Non-Functional Requirements

| ID         | Requirement                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **REQ-27** | The suggestion computation function MUST be pure: given the same inputs, it MUST return the same output with no side effects.                                                          |
| **REQ-28** | The suggestion computation MUST NOT block user input or render — it SHALL be synchronous and execute in under 1 ms for typical gym sets.                                               |
| **REQ-29** | The suggestion feature MUST function correctly in offline mode, as all computation is client-side and requires no network requests.                                                    |
| **REQ-30** | The suggestion badge SHOULD maintain visual stability on mobile viewports; the badge container SHOULD reserve a minimum height to prevent layout shift when appearing or disappearing. |

---

## 2. Scenarios (Given/When/Then)

### 2.1 Normal Operation — Full Data

#### SC-1: Suggest SUBIR when actual RIR is below target

```gherkin
Given a user has logged Set 1 with weight=70 kg, reps=8, actualRir=3
And the target for Set 2 is targetRir=2 and repsTarget=8
When the suggestion is computed
Then the action SHALL be SUBIR
And the suggested weight SHALL be greater than 70 kg
And the suggested weight SHALL be rounded to the nearest 1.25 kg
```

#### SC-2: Suggest BAJAR when actual RIR is above target

```gherkin
Given a user has logged Set 1 with weight=70 kg, reps=8, actualRir=4
And the target for Set 2 is targetRir=2 and repsTarget=8
When the suggestion is computed
Then the action SHALL be BAJAR
And the suggested weight SHALL be less than 70 kg
And the suggested weight SHALL be rounded to the nearest 1.25 kg
```

#### SC-3: Suggest MANTENER when actual RIR matches target

```gherkin
Given a user has logged Set 1 with weight=70 kg, reps=8, actualRir=2
And the target for Set 2 is targetRir=2 and repsTarget=8
When the suggestion is computed
Then the action SHALL be MANTENER
And the suggested weight SHALL be 70 kg (or within ±1.25 kg after rounding)
```

#### SC-4: Suggest SUBIR with a large rep-RIR gap

```gherkin
Given a user has logged Set 1 with weight=50 kg, reps=10, actualRir=3
And the target for Set 2 is targetRir=1 and repsTarget=8
When the suggestion is computed
Then the action SHALL be SUBIR
And the suggested weight SHALL be significantly higher than 50 kg
```

### 2.2 Edge Cases — Missing Data

#### SC-5: No suggestion when weight is null

```gherkin
Given a user has logged Set 1 with weight=null, reps=8, actualRir=2
And the target for Set 2 is targetRir=2 and repsTarget=8
When the suggestion is computed
Then the result SHALL be null (no suggestion)
```

#### SC-6: No suggestion when reps is null

```gherkin
Given a user has logged Set 1 with weight=70 kg, reps=null, actualRir=2
And the target for Set 2 is targetRir=2 and repsTarget=8
When the suggestion is computed
Then the result SHALL be null (no suggestion)
```

#### SC-7: No suggestion when actualRir is null

```gherkin
Given a user has logged Set 1 with weight=70 kg, reps=8, actualRir=null
And the target for Set 2 is targetRir=2 and repsTarget=8
When the suggestion is computed
Then the result SHALL be null (no suggestion)
```

#### SC-8: No suggestion when targetRir is null

```gherkin
Given a user has logged Set 1 with weight=70 kg, reps=8, actualRir=2
And the target for Set 2 has targetRir=null
When the suggestion is computed
Then the result SHALL be null (no suggestion)
```

#### SC-9: No suggestion for first set of exercise

```gherkin
Given no sets have been logged for an exercise
When the suggestion is computed for Set 1
Then the result SHALL be null (no suggestion)
```

#### SC-10: No suggestion for last set of exercise

```gherkin
Given an exercise has 3 total sets
And Set 3 has just been logged (weight=70 kg, reps=8, actualRir=2)
When the suggestion is computed for Set 4
Then the result SHALL be null (no suggestion)
```

### 2.3 Rounding Behavior

#### SC-11: Weight rounds up to nearest 1.25 kg

```gherkin
Given a raw suggested weight of 71.3 kg
When the weight is rounded to the nearest 1.25 kg
Then the result SHALL be 71.25 kg
```

#### SC-12: Weight rounds down to nearest 1.25 kg

```gherkin
Given a raw suggested weight of 71.8 kg
When the weight is rounded to the nearest 1.25 kg
Then the result SHALL be 72.5 kg
```

#### SC-13: Weight already at 1.25 kg boundary stays unchanged

```gherkin
Given a raw suggested weight of 72.5 kg
When the weight is rounded to the nearest 1.25 kg
Then the result SHALL be 72.5 kg
```

#### SC-14: Exact 1.25 kg midpoint rounds up

```gherkin
Given a raw suggested weight of 71.875 kg (exactly halfway between 71.25 and 72.5)
When the weight is rounded to the nearest 1.25 kg using Math.round
Then the result SHALL be 72.5 kg
```

#### SC-15: Delta less than 1.25 kg triggers MANTENER

```gherkin
Given a user has logged Set 1 with weight=70 kg, reps=8, actualRir=2
And the target for Set 2 is targetRir=2 and repsTarget=8
And the computed suggested weight after rounding is 70.0 kg
When the suggestion is computed
Then the action SHALL be MANTENER
```

### 2.4 Reps Clamping

#### SC-16: Reps below 5 are clamped to 5

```gherkin
Given a user has logged Set 1 with weight=100 kg, reps=3, actualRir=2
And the target for Set 2 is targetRir=2 and repsTarget=8
When the suggestion is computed
Then effectiveReps used in the formula SHALL be 5
And the result SHALL NOT be null
```

#### SC-17: Reps above 15 are clamped to 15

```gherkin
Given a user has logged Set 1 with weight=40 kg, reps=20, actualRir=2
And the target for Set 2 is targetRir=2 and repsTarget=8
When the suggestion is computed
Then effectiveReps used in the formula SHALL be 15
And the result SHALL NOT be null
```

### 2.5 Target Resolution — Per-Set vs Exercise-Level

#### SC-18: Per-set rirTarget takes precedence over exercise-level

```gherkin
Given RoutineExercise.targetRir = 3
And RoutineExerciseSetReference for Set 2 has rirTarget = 1
And Set 1 was logged with weight=70 kg, reps=8, actualRir=2
When the suggestion is computed for Set 2
Then the targetRir used SHALL be 1 (per-set value)
And the action SHALL be BAJAR (because actualRir=2 > targetRir=1)
```

#### SC-19: Falls back to exercise-level targetRir when per-set is absent

```gherkin
Given RoutineExercise.targetRir = 2
And RoutineExerciseSetReference for Set 2 has rirTarget = null
And Set 1 was logged with weight=70 kg, reps=8, actualRir=3
When the suggestion is computed for Set 2
Then the targetRir used SHALL be 2 (exercise-level fallback)
And the action SHALL be SUBIR (because actualRir=3 > targetRir=2 → lower weight needed for same RIR → wait, re-check)
```

**Correction:** When actualRir=3 and targetRir=2, the user had MORE reserve than planned, meaning they could have gone heavier. So the suggestion should be SUBIR. This is correct.

#### SC-20: Per-set repsTarget with range format

```gherkin
Given RoutineExerciseSetReference for Set 2 has repsTarget = "8-10"
And Set 1 was logged with weight=70 kg, reps=8, actualRir=2
And targetRir = 2
When the suggestion is computed for Set 2
Then the effective targetReps SHALL be 9 (midpoint of 8 and 10)
And the suggestion SHALL be computed using targetRepsEff = 9
```

#### SC-21: Unparseable repsTarget falls back to default midpoint of 8

```gherkin
Given RoutineExerciseSetReference for Set 2 has repsTarget = "8 a 10"
And Set 1 was logged with weight=70 kg, reps=8, actualRir=2
And targetRir = 2
When the suggestion is computed for Set 2
Then repsTarget SHALL be treated as unparseable (does not match ^\d+(-\d+)?$)
And the effective targetReps SHALL be 8 (default midpoint)
```

#### SC-22: Empty repsTarget falls back to default midpoint of 8

```gherkin
Given RoutineExerciseSetReference for Set 2 has repsTarget = ""
And Set 1 was logged with weight=70 kg, reps=8, actualRir=2
And targetRir = 2
When the suggestion is computed for Set 2
Then the effective targetReps SHALL be 8 (default midpoint)
```

### 2.6 UI Visibility

#### SC-23: Suggestion badge appears after complete set log

```gherkin
Given the user is in an active workout session
And the user has just completed logging Set 1 (weight, reps, RIR all filled)
And Set 2 is not the last set
When the set is saved
Then a suggestion badge SHALL appear between Set 1 and Set 2 rows
And the badge SHALL display the action verb and suggested weight
```

#### SC-24: Suggestion badge disappears on user input

```gherkin
Given a suggestion badge is visible for Set 2
When the user begins typing in Set 2's weight, reps, or RIR input field
Then the suggestion badge SHALL be removed from the DOM
```

#### SC-25: Suggestion badge does not appear before any set is logged

```gherkin
Given the user is in an active workout session
And no sets have been logged yet
When the session screen renders
Then no suggestion badge SHALL be visible
```

#### SC-26: Suggestion badge does not appear for last set

```gherkin
Given an exercise has 3 sets
And the user has just completed logging Set 2
When the session screen renders Set 3
Then no suggestion badge SHALL appear after Set 3 (it is the last set)
```

#### SC-27: Suggestion badge does not modify input values

```gherkin
Given a suggestion badge displays "SUBIR a ~72.5 kg" for Set 2
When the user views Set 2's input fields
Then the weight, reps, and RIR inputs SHALL remain empty (not pre-filled)
And the user SHALL manually enter any values
```

### 2.7 Non-Functional Scenarios

#### SC-28: Suggestion computation does not block input

```gherkin
Given the user is typing rapidly in the reps input field
When the previous set's suggestion is being computed
Then the input field SHALL remain responsive with no perceptible lag
And the suggestion computation SHALL complete in under 1 ms
```

#### SC-29: Suggestion works offline

```gherkin
Given the device has no network connectivity
And the user is in an active workout session
And the user has just completed logging Set 1
When the session screen renders
Then the suggestion badge SHALL appear correctly
And no network error SHALL be logged
```

#### SC-30: Suggestion is a pure function

```gherkin
Given the same inputs: lastSet={weight: 70, reps: 8, actualRir: 2}, targetReps=8, targetRir=2
When getWeightSuggestion is called twice
Then both calls SHALL return identical results
And no external state SHALL be modified
```

---

## 3. Scenario Coverage Matrix

| Requirement                                | Scenarios                     |
| ------------------------------------------ | ----------------------------- |
| REQ-1 (Epley formula)                      | SC-1, SC-2, SC-3, SC-4, SC-30 |
| REQ-2 (Reps clamping [5,15])               | SC-16, SC-17                  |
| REQ-3 (Suggested weight formula)           | SC-1, SC-2, SC-3, SC-4        |
| REQ-4 (1.25 kg rounding)                   | SC-11, SC-12, SC-13, SC-14    |
| REQ-5 (SUBIR classification)               | SC-1, SC-4                    |
| REQ-6 (BAJAR classification)               | SC-2                          |
| REQ-7 (MANTENER classification)            | SC-3, SC-15                   |
| REQ-8 (Visible after complete log)         | SC-23                         |
| REQ-9 (No suggestion when incomplete)      | SC-5, SC-6, SC-7              |
| REQ-10 (No suggestion when targetRir null) | SC-8                          |
| REQ-11 (No suggestion for last set)        | SC-10, SC-26                  |
| REQ-12 (No suggestion for first set)       | SC-9, SC-25                   |
| REQ-13 (Disappears on input)               | SC-24                         |
| REQ-14 (Targets next set)                  | SC-23, SC-26                  |
| REQ-15-17 (RIR target resolution)          | SC-18, SC-19, SC-8            |
| REQ-18-20 (Reps target resolution)         | SC-20, SC-21, SC-22           |
| REQ-21-24 (Badge presentation)             | SC-23, SC-27                  |
| REQ-25 (No auto-fill)                      | SC-27                         |
| REQ-26 (UI placement)                      | SC-23                         |
| REQ-27 (Pure function)                     | SC-30                         |
| REQ-28 (Non-blocking)                      | SC-28                         |
| REQ-29 (Offline)                           | SC-29                         |
| REQ-30 (Layout stability)                  | SC-23                         |

**Total scenarios: 30** | **Coverage: 100% of requirements**

---

## 4. Acceptance Criteria

1. All 30 Given/When/Then scenarios are validated by tests or manual verification.
2. `vitest run src/domain/suggestions.test.ts` passes with at least 15 distinct test cases covering SC-1 through SC-22.
3. `WorkoutSessionScreen.test.tsx` includes tests for SC-23, SC-24, SC-25, SC-26, and SC-27.
4. No regression in existing session tests.
5. Lint and typecheck pass: `npm run lint` and `npm run typecheck`.
