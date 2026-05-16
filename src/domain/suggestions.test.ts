import { describe, it, expect } from 'vitest'
import {
    clampEffectiveReps,
    roundToNearest125,
    resolveEffectiveTargetReps,
    resolveRirTarget,
    getWeightSuggestion,
} from './suggestions'

describe('suggestions: clampEffectiveReps', () => {
    it('returns reps unchanged when within [5, 15]', () => {
        expect(clampEffectiveReps(8)).toBe(8)
        expect(clampEffectiveReps(5)).toBe(5)
        expect(clampEffectiveReps(15)).toBe(15)
        expect(clampEffectiveReps(10)).toBe(10)
    })

    it('clamps reps below 5 to 5 (SC-16)', () => {
        expect(clampEffectiveReps(3)).toBe(5)
        expect(clampEffectiveReps(0)).toBe(5)
        expect(clampEffectiveReps(-2)).toBe(5)
    })

    it('clamps reps above 15 to 15 (SC-17)', () => {
        expect(clampEffectiveReps(20)).toBe(15)
        expect(clampEffectiveReps(100)).toBe(15)
        expect(clampEffectiveReps(15.1)).toBe(15)
    })
})

describe('suggestions: roundToNearest125', () => {
    it('rounds up to nearest 1.25 kg (SC-11)', () => {
        expect(roundToNearest125(71.3)).toBe(71.25)
    })

    // SC-12: Math.round(71.8/1.25)=57 < 57.5 -> rounds DOWN to 71.25 (spec text has wrong expected value)
    it('rounds to nearest 1.25 kg (SC-12)', () => {
        expect(roundToNearest125(71.8)).toBe(71.25)
    })

    it('keeps weight already at 1.25 kg boundary unchanged (SC-13)', () => {
        expect(roundToNearest125(72.5)).toBe(72.5)
        expect(roundToNearest125(70.0)).toBe(70)
        expect(roundToNearest125(0)).toBe(0)
    })

    it('rounds exact midpoint up to next 1.25 kg boundary (SC-14)', () => {
        // 71.875 is exactly between 71.25 and 72.5; Math.round goes up
        expect(roundToNearest125(71.875)).toBe(72.5)
        // midpoint of 72.5 and 73.75 is 73.125
        expect(roundToNearest125(73.125)).toBe(73.75)
    })
})

describe('suggestions: resolveEffectiveTargetReps', () => {
    it('parses single number target (default path)', () => {
        expect(resolveEffectiveTargetReps('8')).toBe(8)
        expect(resolveEffectiveTargetReps('10')).toBe(10)
    })

    it('computes midpoint for range format "lo-hi" (SC-20)', () => {
        expect(resolveEffectiveTargetReps('8-10')).toBe(9)
        expect(resolveEffectiveTargetReps('6-10')).toBe(8)
        expect(resolveEffectiveTargetReps('5-8')).toBe(7)
        expect(resolveEffectiveTargetReps('1-12')).toBe(7)
    })

    it('handles slash separator "lo/hi"', () => {
        expect(resolveEffectiveTargetReps('8/10')).toBe(9)
    })

    it('falls back to default 8 for unparseable string (SC-21)', () => {
        expect(resolveEffectiveTargetReps('8 a 10')).toBe(8)
        expect(resolveEffectiveTargetReps('ocho-diez')).toBe(8)
        expect(resolveEffectiveTargetReps('8-')).toBe(8)
        expect(resolveEffectiveTargetReps('-10')).toBe(8)
    })

    it('falls back to default 8 for empty or undefined input (SC-22)', () => {
        expect(resolveEffectiveTargetReps('')).toBe(8)
        expect(resolveEffectiveTargetReps(undefined)).toBe(8)
    })

    it('returns low when high <= low', () => {
        expect(resolveEffectiveTargetReps('10-8')).toBe(10)
    })
})

describe('suggestions: resolveRirTarget', () => {
    it('uses per-set rirTarget when parseable (SC-18)', () => {
        expect(resolveRirTarget('1', 3)).toBe(1)
        expect(resolveRirTarget('2', 3)).toBe(2)
    })

    it('falls back to exercise-level targetRir when per-set absent (SC-19)', () => {
        expect(resolveRirTarget(undefined, 2)).toBe(2)
        expect(resolveRirTarget('', 2)).toBe(2)
    })

    it('falls back to exercise when per-set is unparseable', () => {
        expect(resolveRirTarget('abc', 2)).toBe(2)
        expect(resolveRirTarget('', 3)).toBe(3)
    })

    it('returns null when both per-set and exercise are absent (SC-8)', () => {
        expect(resolveRirTarget(undefined, null)).toBeNull()
        expect(resolveRirTarget('', null)).toBeNull()
    })

    it('handles decimal comma in per-set target', () => {
        expect(resolveRirTarget('1,5', 3)).toBe(1.5)
    })
})

describe('suggestions: getWeightSuggestion — normal operation', () => {
    // SC-3: clampedReps=10, targetRepsEff=10 -> raw=70.0 -> rounded=70 -> delta=0 -> MANTENER
    it('returns MANTENER when effective reps match target (SC-3)', () => {
        const result = getWeightSuggestion({
            lastSet: { weightKg: 70, reps: 8, actualRir: 2 },
            targetRepsEff: 10,
            targetRir: 2,
        })
        expect(result).not.toBeNull()
        expect(result!.action).toBe('MANTENER')
        expect(result!.suggestedWeightKg).toBe(70)
    })

    // SC-1: 70kg, 8+3=11 -> clamped=11, targetRepsEff=8 -> raw=75.53 -> rounded=75 -> delta=+5 -> SUBIR
    it('returns SUBIR when actualRir is below target (SC-1)', () => {
        const result = getWeightSuggestion({
            lastSet: { weightKg: 70, reps: 8, actualRir: 3 },
            targetRepsEff: 8,
            targetRir: 2,
        })
        expect(result).not.toBeNull()
        expect(result!.action).toBe('SUBIR')
        expect(result!.suggestedWeightKg).toBe(75)
    })

    // clampedReps=12, targetRepsEff=14 -> raw=66.82 -> rounded=66.25 -> delta=-3.75 -> BAJAR
    it('returns BAJAR when target reps exceed effective reps (SC-2)', () => {
        const result = getWeightSuggestion({
            lastSet: { weightKg: 70, reps: 8, actualRir: 4 },
            targetRepsEff: 14,
            targetRir: 2,
        })
        expect(result).not.toBeNull()
        expect(result!.action).toBe('BAJAR')
        expect(result!.suggestedWeightKg).toBe(66.25)
    })

    // SC-4: 50kg, 10+3=13 -> clamped=13, targetRepsEff=8 -> raw=61.92 -> rounded=62.5 -> delta=+12.5 -> SUBIR
    it('returns SUBIR with large weight increase for big rep-RIR gap (SC-4)', () => {
        const result = getWeightSuggestion({
            lastSet: { weightKg: 50, reps: 10, actualRir: 3 },
            targetRepsEff: 8,
            targetRir: 1,
        })
        expect(result).not.toBeNull()
        expect(result!.action).toBe('SUBIR')
        expect(result!.suggestedWeightKg - 50).toBeGreaterThanOrEqual(1.25)
    })

    // SC-5: null when weight is missing
    it('returns null when weight is null (SC-5)', () => {
        const input = {
            lastSet: { weightKg: null as unknown as number, reps: 8, actualRir: 2 },
            targetRepsEff: 8,
            targetRir: 2,
        }
        expect(getWeightSuggestion(input)).toBeNull()
    })

    // SC-6: null when reps is missing
    it('returns null when reps is null (SC-6)', () => {
        const input = {
            lastSet: { weightKg: 70, reps: null as unknown as number, actualRir: 2 },
            targetRepsEff: 8,
            targetRir: 2,
        }
        expect(getWeightSuggestion(input)).toBeNull()
    })

    // SC-7: null when actualRir is missing
    it('returns null when actualRir is null (SC-7)', () => {
        const input = {
            lastSet: { weightKg: 70, reps: 8, actualRir: null as unknown as number },
            targetRepsEff: 8,
            targetRir: 2,
        }
        expect(getWeightSuggestion(input)).toBeNull()
    })

    // SC-8: null when targetRir is null
    it('returns null when targetRir is null (SC-8)', () => {
        const input = {
            lastSet: { weightKg: 70, reps: 8, actualRir: 2 },
            targetRepsEff: 8,
            targetRir: null as unknown as number,
        }
        expect(getWeightSuggestion(input)).toBeNull()
    })
})

describe('suggestions: getWeightSuggestion — clamping', () => {
    // SC-16: 100kg, 3+2=5 -> clamped=5, targetRepsEff=8 -> raw=100*35/38=92.11 -> 92.5 -> delta=-7.5 -> BAJAR
    it('clamps effectiveReps to 5 when reps are very low (SC-16)', () => {
        const result = getWeightSuggestion({
            lastSet: { weightKg: 100, reps: 3, actualRir: 2 },
            targetRepsEff: 8,
            targetRir: 2,
        })
        expect(result).not.toBeNull()
        expect(result!.action).toBe('BAJAR')
        expect(result!.suggestedWeightKg).toBe(92.5)
    })

    // SC-17: 40kg, 20+2=22 -> clamped=15, targetRepsEff=8 -> raw=40*45/38=47.37 -> 47.5 -> delta=+7.5 -> SUBIR
    it('clamps effectiveReps to 15 when reps are very high (SC-17)', () => {
        const result = getWeightSuggestion({
            lastSet: { weightKg: 40, reps: 20, actualRir: 2 },
            targetRepsEff: 8,
            targetRir: 2,
        })
        expect(result).not.toBeNull()
        expect(result!.action).toBe('SUBIR')
        expect(result!.suggestedWeightKg).toBe(47.5)
    })
})

describe('suggestions: getWeightSuggestion — SC-15 delta threshold', () => {
    // targetRepsEff=10 gives raw=70.0 -> rounded=70 -> delta=0 -> MANTENER
    it('classifies as MANTENER when delta after rounding is below 1.25 (SC-15)', () => {
        const input = {
            lastSet: { weightKg: 70, reps: 8, actualRir: 2 },
            targetRepsEff: 10,
            targetRir: 2,
        }
        const result = getWeightSuggestion(input)
        expect(result).not.toBeNull()
        expect(result!.action).toBe('MANTENER')
        expect(result!.suggestedWeightKg).toBe(70)
    })

    it('SUBIR when delta is exactly +1.25 or more', () => {
        // User example: 15kg, 12+2=14, targetRepsEff=8 -> raw=17.37 -> rounded=17.5 -> delta=+2.5 -> SUBIR
        const result = getWeightSuggestion({
            lastSet: { weightKg: 15, reps: 12, actualRir: 2 },
            targetRepsEff: 8,
            targetRir: 0.5,
        })
        expect(result).not.toBeNull()
        expect(result!.action).toBe('SUBIR')
        expect(result!.suggestedWeightKg).toBe(17.5)
        expect(result!.suggestedWeightKg - result!.lastSetWeightKg).toBeGreaterThanOrEqual(1.25)
    })

    it('BAJAR when delta is exactly -1.25 or less', () => {
        // 70kg, 6+0=6, targetRepsEff=8 -> raw=67.5 -> delta=-2.5 -> BAJAR
        const result = getWeightSuggestion({
            lastSet: { weightKg: 70, reps: 6, actualRir: 0 },
            targetRepsEff: 8,
            targetRir: 2,
        })
        expect(result).not.toBeNull()
        expect(result!.action).toBe('BAJAR')
        expect(result!.lastSetWeightKg - result!.suggestedWeightKg).toBeGreaterThanOrEqual(1.25)
    })
})

describe('suggestions: getWeightSuggestion — idempotency (SC-30)', () => {
    it('pure function: same inputs produce same output', () => {
        const input = {
            lastSet: { weightKg: 70, reps: 8, actualRir: 2 },
            targetRepsEff: 10,
            targetRir: 2,
        }
        const first = getWeightSuggestion(input)
        const second = getWeightSuggestion(input)
        expect(first).toEqual(second)
        expect(first).toEqual({ action: 'MANTENER', suggestedWeightKg: 70, lastSetWeightKg: 70 })
    })
})