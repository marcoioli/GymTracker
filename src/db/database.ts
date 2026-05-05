import Dexie, { type EntityTable } from 'dexie'

import { normalizeRoutineRecord, type ExerciseCatalogEntry, type Routine } from '../domain/routines'
import { normalizeWorkoutSessionRecord, type WorkoutSession } from '../domain/sessions'

export type RoutineRecord = Routine

export type ExerciseCatalogRecord = ExerciseCatalogEntry

export type SessionRecord = WorkoutSession

export type AppStateRecord = {
  key: 'activeRoutineId' | 'lastOpenedAt'
  value: string
}

class GymTrackerDatabase extends Dexie {
  routines!: EntityTable<RoutineRecord, 'id'>
  exerciseCatalog!: EntityTable<ExerciseCatalogRecord, 'id'>
  sessions!: EntityTable<SessionRecord, 'id'>
  appState!: EntityTable<AppStateRecord, 'key'>

  constructor() {
    super('gymtracker-db')

    this.version(1).stores({
      routines: 'id, status, updatedAt',
      exerciseCatalog: 'id, name, updatedAt',
      sessions: 'id, routineId, dayId, startedAt, endedAt, status',
      appState: 'key'
    })

    this.version(2)
      .stores({
      routines: 'id, status, updatedAt',
      exerciseCatalog: 'id, name, normalizedName, updatedAt',
      sessions: 'id, routineId, dayId, startedAt, endedAt, status, [routineId+dayId]',
      appState: 'key'
    })
      .upgrade(async (transaction) => {
        await transaction
          .table('exerciseCatalog')
          .toCollection()
          .modify((entry: ExerciseCatalogRecord) => {
            entry.normalizedName = entry.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
          })
      })

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
          .modify((routine: RoutineRecord) => {
            Object.assign(routine, normalizeRoutineRecord(routine))
          })

        await transaction
          .table('sessions')
          .toCollection()
          .modify((session: SessionRecord) => {
            Object.assign(session, normalizeWorkoutSessionRecord(session))
          })
      })

    this.on('blocked', () => {
      console.warn('GymTracker DB upgrade blocked by another open tab or process.')
    })

    this.on('versionchange', () => {
      this.close()
    })
  }
}

export const db = new GymTrackerDatabase()
