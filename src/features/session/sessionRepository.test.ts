import { db } from '../../db/database'
import { getPreviousSessionReferences, saveWorkoutSession } from './sessionRepository'

describe('sessionRepository', () => {
  it('saves an early-finished snapshot without mutating previous history and updates routine progress', async () => {
    const routineId = 'routine-1'
    const dayId = 'day-1'
    const exerciseId = 'exercise-1'

    await db.routines.add({
      id: routineId,
      name: 'Upper A',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [
            {
              id: dayId,
              label: 'Push pesado',
              exercises: [{ id: exerciseId, name: 'Press banca', targetSets: 2, targetRir: 1, muscle: 'Pecho' }]
            }
          ]
        }
      ],
      progress: {
        currentWeekIndex: 0,
        lastCompletedDayId: null,
        lastCompletedAt: null
      },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })

    await db.sessions.add({
      id: 'session-old',
      routineId,
      dayId,
      weekIndex: 0,
      status: 'completed',
      notes: '  mantener pausa abajo  ',
      startedAt: '2026-05-04T10:00:00.000Z',
      endedAt: '2026-05-04T10:40:00.000Z',
      exercises: [
        {
          id: 'snapshot-old',
          exerciseTemplateId: exerciseId,
          exerciseName: 'Press banca',
          targetSets: 2,
          targetRir: 1,
          muscle: 'Pecho',
          notes: '  abrir pecho y no apurar la bajada  ',
          sets: [
            { id: 'set-1', setNumber: 1, reps: 8, weightKg: 80, actualRir: 2 },
            { id: 'set-2', setNumber: 2, reps: 8, weightKg: 80, actualRir: 1 }
          ]
        }
      ]
    })

    const references = await getPreviousSessionReferences(routineId, dayId)

    expect(references.sessionNote).toBe('mantener pausa abajo')
    expect(references.exercises[exerciseId]?.notes).toBe('abrir pecho y no apurar la bajada')
    expect(references.exercises[exerciseId]?.sets[0]).toEqual({ reps: 8, weightKg: 80, actualRir: 2 })

    const savedSession = await saveWorkoutSession({
      routineId,
      weekIndex: 0,
      dayId,
      startedAt: '2026-05-05T11:00:00.000Z',
      endedAt: '2026-05-05T11:20:00.000Z',
      status: 'ended-early',
      notes: '  la sesión quedó cortada por tiempo  ',
      exercises: [
        {
          exerciseId,
          exerciseName: 'Press banca',
          notes: '  mejor empuje con pies firmes  ',
          sets: [
            { reps: '10', weightKg: '82.5', actualRir: '1' },
            { reps: '', weightKg: '', actualRir: '' }
          ]
        }
      ]
    })

    const previousSession = await db.sessions.get('session-old')
    const updatedRoutine = await db.routines.get(routineId)

    expect(savedSession.status).toBe('ended-early')
    expect(savedSession.notes).toBe('la sesión quedó cortada por tiempo')
    expect(savedSession.routineName).toBe('Upper A')
    expect(savedSession.weekLabel).toBe('Semana 1')
    expect(savedSession.dayLabel).toBe('Push pesado')
    expect(savedSession.exercises[0].sets).toMatchObject([
      { setNumber: 1, reps: 10, weightKg: 82.5, actualRir: 1 },
      { setNumber: 2, reps: null, weightKg: null, actualRir: null }
    ])
    expect(savedSession.exercises[0]?.muscle).toBe('Pecho')
    expect(savedSession.exercises[0]?.notes).toBe('mejor empuje con pies firmes')
    expect(previousSession?.status).toBe('completed')
    expect(previousSession?.exercises[0].sets[0]).toMatchObject({ reps: 8, weightKg: 80, actualRir: 2 })
    expect(updatedRoutine?.progress).toEqual({
      currentWeekIndex: 0,
      lastCompletedDayId: dayId,
      lastCompletedAt: '2026-05-05T11:20:00.000Z'
    })
  })

  it('sanitizes malformed numeric input and ignores broken historical reference fragments', async () => {
    const routineId = 'routine-1'
    const dayId = 'day-1'
    const exerciseId = 'exercise-1'

    await db.routines.add({
      id: routineId,
      name: 'Upper A',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [{ id: dayId, label: 'Push pesado', exercises: [{ id: exerciseId, name: 'Press banca', targetSets: 3, targetRir: 1, muscle: 'Pecho' }] }]
        }
      ],
      progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })

    await db.sessions.add({
      id: 'broken-reference',
      routineId,
      dayId,
      weekIndex: 0,
      status: 'completed',
      startedAt: '2026-05-04T10:00:00.000Z',
      endedAt: '2026-05-04T10:40:00.000Z',
      exercises: [{ id: 'broken', exerciseTemplateId: null, exerciseName: '   ', targetSets: 1, targetRir: null, sets: [], muscle: 'PG' }]
    })

    expect(await getPreviousSessionReferences(routineId, dayId)).toEqual({ exercises: {} })

    const savedSession = await saveWorkoutSession({
      routineId,
      weekIndex: 0,
      dayId,
      startedAt: '2026-05-05T11:00:00.000Z',
      endedAt: '2026-05-05T11:20:00.000Z',
      status: 'completed',
      exercises: [{ exerciseId, exerciseName: 'Press banca', sets: [{ reps: '10', weightKg: '82,5', actualRir: 'abc' }] }]
    })

    expect(savedSession.exercises[0].sets).toMatchObject([
      { setNumber: 1, reps: 10, weightKg: 82.5, actualRir: null },
      { setNumber: 2, reps: null, weightKg: null, actualRir: null },
      { setNumber: 3, reps: null, weightKg: null, actualRir: null }
    ])
  })
})
