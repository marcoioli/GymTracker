import {
  GYMTRACKER_BACKUP_KIND,
  GYMTRACKER_BACKUP_VERSION,
  getBackupEntityCounts,
  normalizeBackupPayload,
  validateBackupPayload
} from './backup'

describe('backup domain', () => {
  it('accepts a valid backup payload and summarizes entity counts', () => {
    const result = validateBackupPayload({
      kind: GYMTRACKER_BACKUP_KIND,
      version: GYMTRACKER_BACKUP_VERSION,
      exportedAt: '2026-05-05T12:00:00.000Z',
      appState: [{ key: 'activeRoutineId', value: 'routine-1' }],
      routines: [{ id: 'routine-1' }],
      exerciseCatalog: [{ id: 'exercise-1' }],
      sessions: [{ id: 'session-1' }]
    })

    expect(result.success).toBe(true)

    if (!result.success) {
      throw new Error('Expected valid backup payload')
    }

    expect(getBackupEntityCounts(result.data)).toEqual({
      appState: 1,
      routines: 1,
      exerciseCatalog: 1,
      sessions: 1
    })
  })

  it('rejects malformed or incompatible backups before restore', () => {
    expect(
      validateBackupPayload({
        kind: GYMTRACKER_BACKUP_KIND,
        version: 99,
        exportedAt: '2026-05-05T12:00:00.000Z',
        appState: [],
        routines: [],
        exerciseCatalog: [],
        sessions: []
      })
    ).toMatchObject({
      success: false,
      error: expect.stringMatching(/versión/i)
    })

    expect(
      validateBackupPayload({
        kind: GYMTRACKER_BACKUP_KIND,
        version: GYMTRACKER_BACKUP_VERSION,
        exportedAt: 'not-a-date',
        appState: {},
        routines: [],
        exerciseCatalog: [],
        sessions: []
      })
    ).toMatchObject({
      success: false,
      error: expect.stringMatching(/fecha|colección/i)
    })
  })

  it('normalizes historical backups that omit muscle on routines and session snapshots', () => {
    const normalized = normalizeBackupPayload({
      kind: GYMTRACKER_BACKUP_KIND,
      version: GYMTRACKER_BACKUP_VERSION,
      exportedAt: '2026-05-05T12:00:00.000Z',
      appState: [],
      routines: [
        {
          id: 'routine-1',
          name: 'Upper A',
          status: 'paused',
          weekCount: 1,
          weeks: [
            {
              id: 'week-1',
              label: 'Semana 1',
              days: [
                {
                  id: 'day-1',
                  label: 'Push',
                  exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 4, targetRir: 2 }]
                }
              ]
            }
          ],
          progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
          createdAt: '2026-05-05T12:00:00.000Z',
          updatedAt: '2026-05-05T12:00:00.000Z'
        }
      ],
      exerciseCatalog: [],
      sessions: [
        {
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
              sets: []
            }
          ],
          startedAt: '2026-05-05T12:00:00.000Z',
          endedAt: '2026-05-05T12:30:00.000Z'
        }
      ]
    })

    expect(normalized.routines[0].weeks[0].days[0].exercises[0]?.muscle).toBe('PG')
    expect(normalized.sessions[0].exercises[0]?.muscle).toBe('PG')
  })
})
