import {
  advanceRoutineProgress,
  getCurrentWeeklyMuscleVolume,
  getWeeklyMuscleVolumeByWeek,
  isMuscleGroup,
  createRoutineProgress,
  createRoutineWeek,
  getSuggestedRoutineDay,
  isValidDayCount,
  normalizeRoutineExercise,
  normalizeExerciseName,
  resolveActiveRoutine,
  resolveRoutineProgress
} from './routines'

describe('routine domain helpers', () => {
  it('validates week day counts between one and seven', () => {
    expect(isValidDayCount(1)).toBe(true)
    expect(isValidDayCount(7)).toBe(true)
    expect(isValidDayCount(0)).toBe(false)
    expect(isValidDayCount(8)).toBe(false)
  })

  it('creates weeks with named days in order', () => {
    const week = createRoutineWeek(1, 3)

    expect(week.label).toBe('Semana 2')
    expect(week.days.map((day) => day.label)).toEqual(['Día 1', 'Día 2', 'Día 3'])
  })

  it('normalizes exercise names for catalog reuse', () => {
    expect(normalizeExerciseName('  Press   banca  ')).toBe('press banca')
  })

  it('accepts known muscle groups and falls back to PG for legacy exercises', () => {
    expect(isMuscleGroup('Pecho')).toBe(true)
    expect(isMuscleGroup('Trapecio')).toBe(false)
    expect(
      normalizeRoutineExercise({ id: 'exercise-1', name: 'Press banca', targetSets: 3, targetRir: 2, muscle: 'Trapecio' })
    ).toMatchObject({ muscle: 'PG' })
  })

  it('suggests the first day when the routine has no progress yet', () => {
    const week = createRoutineWeek(0, 2)
    week.days[0].exercises = [{ id: 'exercise-1', name: 'Press banca', targetSets: 3, targetRir: 2 }]

    const suggestion = getSuggestedRoutineDay({
      id: 'routine-1',
      name: 'Upper Lower',
      status: 'active',
      weekCount: 1,
      weeks: [week],
      progress: createRoutineProgress(),
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })

    expect(suggestion?.weekIndex).toBe(0)
    expect(suggestion?.day.id).toBe(week.days[0].id)
  })

  it('suggests the next day and advances to the next week after the last day', () => {
    const firstWeek = createRoutineWeek(0, 2)
    const secondWeek = createRoutineWeek(1, 1)
    firstWeek.days[1].exercises = [{ id: 'exercise-1', name: 'Remo con barra', targetSets: 2, targetRir: 1 }]
    secondWeek.days[0].exercises = [{ id: 'exercise-2', name: 'Sentadilla frontal', targetSets: 3, targetRir: 2 }]
    const routine = {
      id: 'routine-1',
      name: 'Push Pull Legs',
      status: 'active' as const,
      weekCount: 2,
      weeks: [firstWeek, secondWeek],
      progress: {
        currentWeekIndex: 0,
        lastCompletedDayId: firstWeek.days[1].id,
        lastCompletedAt: '2026-05-05T10:00:00.000Z'
      },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    }

    const suggestion = getSuggestedRoutineDay(routine)

    expect(suggestion?.weekIndex).toBe(1)
    expect(suggestion?.day.id).toBe(secondWeek.days[0].id)

    const progress = advanceRoutineProgress(routine, {
      weekIndex: 1,
      dayIndex: 0,
      weekId: secondWeek.id,
      weekLabel: secondWeek.label,
      day: secondWeek.days[0]
    }, '2026-05-06T10:00:00.000Z')

    expect(progress).toEqual({
      currentWeekIndex: 0,
      lastCompletedDayId: secondWeek.days[0].id,
      lastCompletedAt: '2026-05-06T10:00:00.000Z'
    })
  })

  it('ignores days without exercises when suggesting the next workout day', () => {
    const firstWeek = createRoutineWeek(0, 2)
    const secondWeek = createRoutineWeek(1, 1)

    firstWeek.days[0].exercises = [
      {
        id: 'exercise-1',
        name: 'Press banca',
        targetSets: 3,
        targetRir: 2
      }
    ]

    secondWeek.days[0].exercises = [
      {
        id: 'exercise-2',
        name: 'Remo con barra',
        targetSets: 3,
        targetRir: 1
      }
    ]

    const suggestion = getSuggestedRoutineDay({
      id: 'routine-1',
      name: 'Upper Lower',
      status: 'active',
      weekCount: 2,
      weeks: [firstWeek, secondWeek],
      progress: {
        currentWeekIndex: 0,
        lastCompletedDayId: firstWeek.days[0].id,
        lastCompletedAt: '2026-05-05T10:00:00.000Z'
      },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })

    expect(suggestion?.weekIndex).toBe(1)
    expect(suggestion?.day.id).toBe(secondWeek.days[0].id)
  })

  it('returns null when the routine has no trainable day with exercises', () => {
    const week = createRoutineWeek(0, 2)

    const suggestion = getSuggestedRoutineDay({
      id: 'routine-1',
      name: 'Upper Lower',
      status: 'active',
      weekCount: 1,
      weeks: [week],
      progress: createRoutineProgress(),
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })

    expect(suggestion).toBeNull()
  })

  it('aggregates weekly planned sets by muscle for one concrete week only', () => {
    const firstWeek = createRoutineWeek(0, 2)
    firstWeek.days[0].exercises = [
      { id: 'exercise-1', name: 'Press banca', targetSets: 4, targetRir: 2, muscle: 'Pecho' },
      { id: 'exercise-2', name: 'Fondos', targetSets: 3, targetRir: 1, muscle: 'Triceps' }
    ]
    firstWeek.days[1].exercises = [{ id: 'exercise-3', name: 'Press militar', targetSets: 2, targetRir: 2, muscle: 'Hombro' }]

    const volume = getWeeklyMuscleVolumeByWeek(
      {
        id: 'routine-1',
        name: 'Upper Lower',
        status: 'active',
        weekCount: 1,
        weeks: [firstWeek],
        progress: createRoutineProgress(),
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-05T10:00:00.000Z'
      },
      0
    )

    expect(volume).toEqual({
      Pecho: 4,
      Espalda: 0,
      Hombro: 2,
      Biceps: 0,
      Triceps: 3,
      Cuadriceps: 0,
      Isquio: 0,
      PG: 0
    })
  })

  it('keeps multi-week muscle summaries isolated to the requested week', () => {
    const firstWeek = createRoutineWeek(0, 1)
    const secondWeek = createRoutineWeek(1, 1)

    firstWeek.days[0].exercises = [{ id: 'exercise-1', name: 'Press banca', targetSets: 4, targetRir: 2, muscle: 'Pecho' }]
    secondWeek.days[0].exercises = [{ id: 'exercise-2', name: 'Sentadilla frontal', targetSets: 5, targetRir: 2, muscle: 'Cuadriceps' }]

    const routine = {
      id: 'routine-1',
      name: 'Upper Lower',
      status: 'active' as const,
      weekCount: 2,
      weeks: [firstWeek, secondWeek],
      progress: {
        currentWeekIndex: 1,
        lastCompletedDayId: null,
        lastCompletedAt: null
      },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    }

    expect(getWeeklyMuscleVolumeByWeek(routine, 0).Pecho).toBe(4)
    expect(getWeeklyMuscleVolumeByWeek(routine, 0).Cuadriceps).toBe(0)
    expect(getCurrentWeeklyMuscleVolume(routine).Cuadriceps).toBe(5)
    expect(getCurrentWeeklyMuscleVolume(routine).Pecho).toBe(0)
  })

  it('repairs stale progress that points outside the routine structure', () => {
    const week = createRoutineWeek(0, 1)

    expect(
      resolveRoutineProgress({
        id: 'routine-1',
        name: 'Upper Lower',
        status: 'active',
        weekCount: 1,
        weeks: [week],
        progress: {
          currentWeekIndex: 99,
          lastCompletedDayId: 'missing-day',
          lastCompletedAt: '2026-05-05T10:00:00.000Z'
        },
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-05T10:00:00.000Z'
      })
    ).toEqual({
      currentWeekIndex: 0,
      lastCompletedDayId: null,
      lastCompletedAt: null
    })
  })

  it('resolves orphaned or conflicting active routine state deterministically', () => {
    const routines = [
      {
        id: 'routine-1',
        name: 'Push Pull',
        status: 'active' as const,
        weekCount: 1,
        weeks: [createRoutineWeek(0, 1)],
        progress: createRoutineProgress(),
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-05T10:00:00.000Z'
      },
      {
        id: 'routine-2',
        name: 'Upper Lower',
        status: 'active' as const,
        weekCount: 1,
        weeks: [createRoutineWeek(0, 1)],
        progress: createRoutineProgress(),
        createdAt: '2026-05-05T10:00:00.000Z',
        updatedAt: '2026-05-06T10:00:00.000Z'
      }
    ]

    expect(resolveActiveRoutine(routines, 'missing-id')).toMatchObject({
      repairedState: true,
      routine: { id: 'routine-2' }
    })
  })
})
