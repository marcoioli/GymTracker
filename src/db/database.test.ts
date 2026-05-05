import Dexie from 'dexie'

import { normalizeRoutineRecord } from '../domain/routines'
import { normalizeWorkoutSessionRecord } from '../domain/sessions'

describe('GymTracker database migrations', () => {
  it('backfills missing muscle data when upgrading routines and sessions to v4', async () => {
    const dbName = `gymtracker-migration-${crypto.randomUUID()}`

    class LegacyDatabase extends Dexie {
      constructor() {
        super(dbName)

        this.version(3).stores({
          routines: 'id, status, updatedAt',
          exerciseCatalog: 'id, name, normalizedName, updatedAt',
          sessions: 'id, routineId, dayId, startedAt, endedAt, status, [routineId+dayId]',
          appState: 'key'
        })
      }
    }

    const legacyDb = new LegacyDatabase()
    await legacyDb.open()
    await legacyDb.table('routines').add({
      id: 'routine-legacy',
      name: 'Legacy',
      status: 'active',
      weekCount: 1,
      weeks: [
        {
          id: 'week-1',
          label: 'Semana 1',
          days: [{ id: 'day-1', label: 'Push', exercises: [{ id: 'exercise-1', name: 'Press banca', targetSets: 4, targetRir: 2 }] }]
        }
      ],
      progress: { currentWeekIndex: 0, lastCompletedDayId: null, lastCompletedAt: null },
      createdAt: '2026-05-05T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })
    await legacyDb.table('sessions').add({
      id: 'session-legacy',
      routineId: 'routine-legacy',
      dayId: 'day-1',
      weekIndex: 0,
      status: 'completed',
      exercises: [{ id: 'snapshot-1', exerciseTemplateId: 'exercise-1', exerciseName: 'Press banca', targetSets: 4, targetRir: 2, sets: [] }],
      startedAt: '2026-05-05T10:00:00.000Z',
      endedAt: '2026-05-05T10:30:00.000Z'
    })
    await legacyDb.close()

    class UpgradedDatabase extends Dexie {
      routines!: Dexie.Table<Record<string, unknown>, string>
      sessions!: Dexie.Table<Record<string, unknown>, string>

      constructor() {
        super(dbName)

        this.version(3).stores({
          routines: 'id, status, updatedAt',
          exerciseCatalog: 'id, name, normalizedName, updatedAt',
          sessions: 'id, routineId, dayId, startedAt, endedAt, status, [routineId+dayId]',
          appState: 'key'
        })

        this.version(4)
          .stores({
            routines: 'id, status, updatedAt',
            exerciseCatalog: 'id, name, normalizedName, updatedAt',
            sessions: 'id, routineId, dayId, startedAt, endedAt, status, [routineId+dayId]',
            appState: 'key'
          })
          .upgrade(async (transaction) => {
            await transaction
              .table('routines')
              .toCollection()
              .modify((routine) => {
                Object.assign(routine, normalizeRoutineRecord(routine as never))
              })

            await transaction
              .table('sessions')
              .toCollection()
              .modify((session) => {
                Object.assign(session, normalizeWorkoutSessionRecord(session as never))
              })
          })
      }
    }

    const db = new UpgradedDatabase()
    await db.open()

    const migratedRoutine = await db.routines.get('routine-legacy')
    const migratedSession = await db.sessions.get('session-legacy')

    expect(migratedRoutine?.weeks[0]?.days[0]?.exercises[0]?.muscle).toBe('PG')
    expect(migratedSession?.exercises[0]?.muscle).toBe('PG')

    await db.close()
    await Dexie.delete(dbName)
  })
})
