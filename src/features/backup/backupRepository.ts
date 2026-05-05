import { db } from '../../db/database'
import {
  createBackupFileName,
  GYMTRACKER_BACKUP_KIND,
  GYMTRACKER_BACKUP_VERSION,
  normalizeBackupPayload,
  type GymTrackerBackup,
  validateBackupPayload
} from '../../domain/backup'

export async function createBackupPayload(): Promise<GymTrackerBackup> {
  const [appState, routines, exerciseCatalog, sessions] = await Promise.all([
    db.appState.toArray(),
    db.routines.toArray(),
    db.exerciseCatalog.toArray(),
    db.sessions.toArray()
  ])

  return normalizeBackupPayload({
    kind: GYMTRACKER_BACKUP_KIND,
    version: GYMTRACKER_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appState,
    routines,
    exerciseCatalog,
    sessions
  })
}

export async function parseBackupFile(file: File): Promise<GymTrackerBackup> {
  const fileContents = await file.text()
  let parsed: unknown

  try {
    parsed = JSON.parse(fileContents) as unknown
  } catch {
    throw new Error('El archivo no contiene un JSON válido para restaurar GymTracker.')
  }

  const validation = validateBackupPayload(parsed)

  if (!validation.success) {
    throw new Error(validation.error)
  }

  return normalizeBackupPayload(validation.data)
}

export async function restoreBackup(backup: GymTrackerBackup): Promise<void> {
  const validation = validateBackupPayload(backup)

  if (!validation.success) {
    throw new Error(validation.error)
  }

  const normalizedBackup = normalizeBackupPayload(validation.data)

  await db.transaction('rw', db.appState, db.routines, db.exerciseCatalog, db.sessions, async () => {
    await Promise.all([db.appState.clear(), db.routines.clear(), db.exerciseCatalog.clear(), db.sessions.clear()])

    if (normalizedBackup.appState.length > 0) {
      await db.appState.bulkPut(normalizedBackup.appState)
    }

    if (normalizedBackup.routines.length > 0) {
      await db.routines.bulkPut(normalizedBackup.routines)
    }

    if (normalizedBackup.exerciseCatalog.length > 0) {
      await db.exerciseCatalog.bulkPut(normalizedBackup.exerciseCatalog)
    }

    if (normalizedBackup.sessions.length > 0) {
      await db.sessions.bulkPut(normalizedBackup.sessions)
    }
  })
}

export async function downloadBackupFile(): Promise<string> {
  const payload = await createBackupPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = createBackupFileName(payload.exportedAt)
  anchor.click()
  URL.revokeObjectURL(url)

  return anchor.download
}
