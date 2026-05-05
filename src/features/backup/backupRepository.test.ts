import { db } from '../../db/database'
import { createBackupPayload, restoreBackup } from './backupRepository'

describe('backupRepository', () => {
  it('exports all persisted collections into one versioned backup payload', async () => {
    await db.appState.put({ key: 'activeRoutineId', value: 'routine-1' })
    await db.routines.add({
      id: 'routine-1',
      name: 'Upper A',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [{ id: 'day-1', label: 'Push', exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 4, targetRir: 2, muscle: 'Pecho' }] }]
        }
      ],
      progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })
    await db.exerciseCatalog.add({
      id: 'exercise-1',
      name: 'Press banca',
      normalizedName: 'press banca',
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })
    await db.sessions.add({
      id: 'session-1',
      routineId: 'routine-1',
      dayId: 'day-1',
      weekIndex: 0,
      status: 'completed',
      exercises: [
        {
          id: 'snapshot-1',
          exerciseTemplateId: 'exercise-1',
          exerciseName: 'Press banca',
          targetSets: 4,
          targetRir: 2,
          muscle: 'Pecho',
          sets: []
        }
      ],
      startedAt: '2026-05-05T10:00:00.000Z',
      endedAt: '2026-05-05T10:30:00.000Z'
    })

    const payload = await createBackupPayload()

    expect(payload).toMatchObject({
      kind: 'gymtracker-backup',
      version: 1,
      appState: [{ key: 'activeRoutineId', value: 'routine-1' }],
      routines: [expect.objectContaining({ id: 'routine-1', name: 'Upper A' })],
      exerciseCatalog: [expect.objectContaining({ id: 'exercise-1', name: 'Press banca' })],
      sessions: [expect.objectContaining({ id: 'session-1', routineId: 'routine-1' })]
    })
    expect(payload.exportedAt).toMatch(/^20\d{2}/)
    expect(payload.routines[0]?.weeks[0]?.days[0]?.exercises[0]?.muscle).toBe('Pecho')
    expect(payload.sessions[0]?.exercises[0]?.muscle).toBe('Pecho')
  })

  it('replaces existing local data transactionally during restore', async () => {
    await db.appState.put({ key: 'activeRoutineId', value: 'old-routine' })
    await db.routines.add({
      id: 'old-routine',
      name: 'Rutina vieja',
      status: 'active',
      weekCount: 1,
      weeks: [],
      progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
      createdAt: '2026-05-05T09:00:00.000Z',
      updatedAt: '2026-05-05T09:00:00.000Z'
    })
    await db.exerciseCatalog.add({
      id: 'old-exercise',
      name: 'Ejercicio viejo',
      normalizedName: 'ejercicio viejo',
      createdAt: '2026-05-05T09:00:00.000Z',
      updatedAt: '2026-05-05T09:00:00.000Z'
    })
    await db.sessions.add({
      id: 'old-session',
      routineId: 'old-routine',
      dayId: 'old-day',
      weekIndex: 0,
      status: 'completed',
      exercises: [],
      startedAt: '2026-05-05T09:00:00.000Z',
      endedAt: '2026-05-05T09:30:00.000Z'
    })

    await restoreBackup({
      kind: 'gymtracker-backup',
      version: 1,
      exportedAt: '2026-05-05T12:00:00.000Z',
      appState: [{ key: 'activeRoutineId', value: 'routine-new' }],
      routines: [
        {
          id: 'routine-new',
          name: 'Rutina restaurada',
          status: 'paused',
          weekCount: 1,
          weeks: [
            {
              id: 'week-new',
              label: 'Semana 1',
              days: [{ id: 'day-new', label: 'Push', exercises: [{ id: 'exercise-new', name: 'Press inclinado', targetSets: 3, targetRir: 2 }] }]
            }
          ],
          progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
          createdAt: '2026-05-05T12:00:00.000Z',
          updatedAt: '2026-05-05T12:00:00.000Z'
        }
      ],
      exerciseCatalog: [
        {
          id: 'exercise-new',
          name: 'Press inclinado',
          normalizedName: 'press inclinado',
          createdAt: '2026-05-05T12:00:00.000Z',
          updatedAt: '2026-05-05T12:00:00.000Z'
        }
      ],
      sessions: [
        {
          id: 'session-new',
          routineId: 'routine-new',
          dayId: 'day-new',
          weekIndex: 0,
          status: 'ended-early',
          exercises: [
            {
              id: 'snapshot-new',
              exerciseTemplateId: 'exercise-new',
              exerciseName: 'Press inclinado',
              targetSets: 3,
              targetRir: 2,
              sets: []
            }
          ],
          startedAt: '2026-05-05T12:00:00.000Z',
          endedAt: '2026-05-05T12:20:00.000Z'
        }
      ]
    })

    expect(await db.routines.get('old-routine')).toBeUndefined()
    expect(await db.sessions.get('old-session')).toBeUndefined()
    expect(await db.appState.get('activeRoutineId')).toEqual({ key: 'activeRoutineId', value: 'routine-new' })
    expect(await db.routines.toArray()).toEqual([expect.objectContaining({ id: 'routine-new', name: 'Rutina restaurada' })])
    expect(await db.exerciseCatalog.toArray()).toEqual([expect.objectContaining({ id: 'exercise-new', name: 'Press inclinado' })])
    expect(await db.sessions.toArray()).toEqual([expect.objectContaining({ id: 'session-new', routineId: 'routine-new' })])
    expect((await db.routines.get('routine-new'))?.weeks[0]?.days[0]?.exercises[0]?.muscle).toBe('PG')
    expect((await db.sessions.get('session-new'))?.exercises[0]?.muscle).toBe('PG')
  })
})
