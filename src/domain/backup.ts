import type { AppStateRecord, ExerciseCatalogRecord, RoutineRecord, SessionRecord } from '../db/database'
import { normalizeRoutineRecord } from './routines'
import { normalizeWorkoutSessionRecord } from './sessions'

export const GYMTRACKER_BACKUP_KIND = 'gymtracker-backup'
export const GYMTRACKER_BACKUP_VERSION = 1

export type GymTrackerBackup = {
  kind: typeof GYMTRACKER_BACKUP_KIND
  version: typeof GYMTRACKER_BACKUP_VERSION
  exportedAt: string
  appState: AppStateRecord[]
  routines: RoutineRecord[]
  exerciseCatalog: ExerciseCatalogRecord[]
  sessions: SessionRecord[]
}

export type BackupValidationResult =
  | {
      success: true
      data: GymTrackerBackup
    }
  | {
      success: false
      error: string
    }

export type BackupEntityCounts = {
  appState: number
  routines: number
  exerciseCatalog: number
  sessions: number
}

export function validateBackupPayload(input: unknown): BackupValidationResult {
  if (!isRecord(input)) {
    return {
      success: false,
      error: 'El archivo no tiene el formato JSON esperado para un backup de GymTracker.'
    }
  }

  if (input.kind !== GYMTRACKER_BACKUP_KIND) {
    return {
      success: false,
      error: 'El archivo no pertenece a un backup local válido de GymTracker.'
    }
  }

  if (input.version !== GYMTRACKER_BACKUP_VERSION) {
    return {
      success: false,
      error: `La versión del backup no es compatible. Esperábamos v${GYMTRACKER_BACKUP_VERSION}.`
    }
  }

  if (typeof input.exportedAt !== 'string' || Number.isNaN(Date.parse(input.exportedAt))) {
    return {
      success: false,
      error: 'El backup no trae una fecha de exportación válida.'
    }
  }

  const collectionChecks = [
    ['appState', input.appState],
    ['routines', input.routines],
    ['exerciseCatalog', input.exerciseCatalog],
    ['sessions', input.sessions]
  ] as const

  for (const [key, value] of collectionChecks) {
    if (!Array.isArray(value)) {
      return {
        success: false,
        error: `El backup no trae la colección "${key}" en el formato esperado.`
      }
    }
  }

  return {
    success: true,
    data: {
      kind: GYMTRACKER_BACKUP_KIND,
      version: GYMTRACKER_BACKUP_VERSION,
      exportedAt: input.exportedAt,
      appState: input.appState as AppStateRecord[],
      routines: input.routines as RoutineRecord[],
      exerciseCatalog: input.exerciseCatalog as ExerciseCatalogRecord[],
      sessions: input.sessions as SessionRecord[]
    }
  }
}

export function getBackupEntityCounts(backup: Pick<GymTrackerBackup, 'appState' | 'routines' | 'exerciseCatalog' | 'sessions'>): BackupEntityCounts {
  return {
    appState: backup.appState.length,
    routines: backup.routines.length,
    exerciseCatalog: backup.exerciseCatalog.length,
    sessions: backup.sessions.length
  }
}

export function normalizeBackupPayload(backup: GymTrackerBackup): GymTrackerBackup {
  return {
    ...backup,
    routines: backup.routines.map(normalizeRoutineRecord),
    sessions: backup.sessions.map(normalizeWorkoutSessionRecord)
  }
}

export function createBackupFileName(exportedAt: string): string {
  const timestamp = exportedAt.replace(/[:.]/g, '-')

  return `gymtracker-backup-v${GYMTRACKER_BACKUP_VERSION}-${timestamp}.json`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
