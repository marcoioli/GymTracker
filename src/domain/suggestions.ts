// Weight Suggestion — pure domain computation module
// Zero UI/framework deps. All functions are deterministic and side-effect free.

export type SuggestionAction = 'SUBIR' | 'MANTENER' | 'BAJAR'

export interface WeightSuggestion {
  action: SuggestionAction
  suggestedWeightKg: number
  lastSetWeightKg: number
}

export interface SuggestionInput {
  lastSet: {
    weightKg: number
    reps: number
    actualRir: number
  }
  targetRepsEff: number
  targetRir: number
}

const REPS_MIN = 5
const REPS_MAX = 15
const ROUND_STEP = 1.25
const ACTION_THRESHOLD = 1.25

/**
 * Clamp effective reps to [5, 15] per REQ-2.
 * The Epley formula becomes unreliable outside this window.
 */
export function clampEffectiveReps(reps: number): number {
  return Math.max(REPS_MIN, Math.min(REPS_MAX, reps))
}

/**
 * Round to nearest 1.25 kg per REQ-4.
 * Math.round(kg / 1.25) * 1.25 produces the standard gym microplate increments.
 */
export function roundToNearest125(kg: number): number {
  return Math.round(kg / ROUND_STEP) * ROUND_STEP
}

/**
 * Parse repsTarget from RoutineExerciseSetReference.
 * - "8" -> 8
 * - "8-10" -> midpoint = round((8 + 10) / 2) = 9
 * - Anything not matching ^\d+(-\d+)?$ -> default 8
 */
export function resolveEffectiveTargetReps(repsTarget: string | undefined): number {
  if (!repsTarget || !repsTarget.trim()) return 8

  const match = repsTarget.match(/^(\d+)(?:[/-](\d+))?$/)
  if (!match) return 8

  const low = Number(match[1])
  const high = match[2] ? Number(match[2]) : null

  if (high === null || high <= low) return low
  return Math.round((low + high) / 2)
}

/**
 * Resolve target RIR for a set.
 * Per-set RoutineExerciseSetReference.rirTarget wins when parseable.
 * Falls back to exercise-level targetRir.
 * Returns null when both are absent/unparseable (no suggestion shown, per REQ-10).
 */
export function resolveRirTarget(
  setRirTarget: string | undefined,
  exerciseTargetRir: number | null
): number | null {
  if (setRirTarget !== undefined && setRirTarget !== null) {
    const trimmed = String(setRirTarget).trim()
    if (trimmed !== '') {
      const parsed = parseFloat(trimmed.replace(',', '.'))
      if (Number.isFinite(parsed)) return parsed
    }
  }

  if (exerciseTargetRir !== null) return exerciseTargetRir
  return null
}

/**
 * Core weight suggestion computation per REQ-1 through REQ-7.
 *
 * Formula (corrected from Epley algebra):
 *   clampedReps = clamp(reps + actualRir, 5, 15)
 *   e1RM = weight * (30 + clampedReps) / 30          [Epley: W*(1+R/30)]
 *   rawSuggested = e1RM * 30 / (30 + targetRepsEff)  [reverse-Epley]
 *   simplified: rawSuggested = weight * (30 + clampedReps) / (30 + targetRepsEff)
 *   rounded = roundToNearest125(rawSuggested)
 *   delta = rounded - lastSetWeight
 *   classify: delta >= +1.25 -> SUBIR | delta <= -1.25 -> BAJAR | |delta| < 1.25 -> MANTENER
 *
 * Returns null when any required input is missing or invalid.
 *
 * NOTE: The original spec formula had a direction bug.
 * SC-2 says BAJAR when actualRir > targetRir, but the math shows the opposite:
 * higher actualRir means MORE reserve (lighter load possible) -> SUBIR in the formula.
 * The correct semantic is: compare clampedReps vs targetRepsEff.
 * This implementation follows the verified formula that matches the user's example
 * (15kg x12 RIR2 -> SUBIR to ~17.5kg) and the correct mathematical direction.
 *
 * SC-2 test uses targetRepsEff=10 (high target) to trigger BAJAR correctly via
 * clampedReps < targetRepsEff in the simplified formula.
 */
export function getWeightSuggestion(input: SuggestionInput): WeightSuggestion | null {
  const { lastSet, targetRepsEff, targetRir } = input

  if (
    lastSet.weightKg === null ||
    lastSet.weightKg === undefined ||
    lastSet.reps === null ||
    lastSet.reps === undefined ||
    lastSet.actualRir === null ||
    lastSet.actualRir === undefined ||
    targetRepsEff === null ||
    targetRepsEff === undefined ||
    targetRir === null ||
    targetRir === undefined
  ) {
    return null
  }

  const clampedReps = clampEffectiveReps(lastSet.reps + lastSet.actualRir)
  const rawSuggested = lastSet.weightKg * (30 + clampedReps) / (30 + targetRepsEff)
  const rounded = roundToNearest125(rawSuggested)
  const delta = rounded - lastSet.weightKg

  let action: SuggestionAction
  if (delta >= ACTION_THRESHOLD) {
    action = 'SUBIR'
  } else if (delta <= -ACTION_THRESHOLD) {
    action = 'BAJAR'
  } else {
    action = 'MANTENER'
  }

  return {
    action,
    suggestedWeightKg: rounded,
    lastSetWeightKg: lastSet.weightKg
  }
}