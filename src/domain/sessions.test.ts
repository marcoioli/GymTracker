import { buildSanitizedSessionSetRecords, normalizeSessionExerciseSnapshot, parseSessionNumericInput } from './sessions'

describe('session domain guards', () => {
  it('normalizes decimal commas and garbage input safely', () => {
    expect(parseSessionNumericInput('82,5')).toBe(82.5)
    expect(parseSessionNumericInput('abc')).toBeNull()
    expect(parseSessionNumericInput('')).toBeNull()
  })

  it('keeps planned set structure even when draft omits inputs', () => {
    expect(
      buildSanitizedSessionSetRecords(3, [{ reps: '10', weightKg: '82,5', actualRir: '1' }, { reps: 'x', weightKg: '', actualRir: '' }])
    ).toEqual([
      { setNumber: 1, reps: 10, weightKg: 82.5, actualRir: 1 },
      { setNumber: 2, reps: null, weightKg: null, actualRir: null },
      { setNumber: 3, reps: null, weightKg: null, actualRir: null }
    ])
  })

  it('preserves explicit muscle snapshots and falls back to PG for legacy ones', () => {
    expect(
      normalizeSessionExerciseSnapshot({
        id: 'snapshot-1',
        exerciseTemplateId: 'exercise-1',
        exerciseName: 'Press banca',
        targetSets: 3,
        targetRir: 2,
        muscle: 'Pecho',
        sets: []
      }).muscle
    ).toBe('Pecho')

    expect(
      normalizeSessionExerciseSnapshot({
        id: 'snapshot-2',
        exerciseTemplateId: 'exercise-2',
        exerciseName: 'Curl inclinado',
        targetSets: 3,
        targetRir: 1,
        sets: []
      }).muscle
    ).toBe('PG')
  })
})
