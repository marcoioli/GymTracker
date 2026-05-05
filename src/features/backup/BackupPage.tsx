import { useRef, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../db/database'
import { getBackupEntityCounts, type GymTrackerBackup } from '../../domain/backup'
import { Button, Card, EmptyState, PageSection, StatusBanner } from '../../shared/ui'
import { downloadBackupFile, parseBackupFile, restoreBackup } from './backupRepository'

export function BackupPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const currentData = useLiveQuery(
    async () => {
      const [appState, routines, exerciseCatalog, sessions] = await Promise.all([
        db.appState.count(),
        db.routines.count(),
        db.exerciseCatalog.count(),
        db.sessions.count()
      ])

      return { appState, routines, exerciseCatalog, sessions }
    },
    [],
    { appState: 0, routines: 0, exerciseCatalog: 0, sessions: 0 }
  )
  const [pendingBackup, setPendingBackup] = useState<GymTrackerBackup | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const pendingCounts = pendingBackup ? getBackupEntityCounts(pendingBackup) : null

  async function handleExport() {
    setIsExporting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const downloadName = await downloadBackupFile()

      setSuccessMessage(`Backup exportado como ${downloadName}. Guardalo fuera del navegador si no querés depender solo de este dispositivo.`)
    } catch {
      setErrorMessage('No pudimos exportar el backup local. Probá de nuevo en este dispositivo.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleImportSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    setErrorMessage(null)
    setSuccessMessage(null)

    if (!file) {
      setPendingBackup(null)
      setPendingFileName(null)
      return
    }

    try {
      const backup = await parseBackupFile(file)

      setPendingBackup(backup)
      setPendingFileName(file.name)
    } catch (error) {
      setPendingBackup(null)
      setPendingFileName(null)
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos leer ese archivo de backup.')
    } finally {
      event.target.value = ''
    }
  }

  async function handleRestore() {
    if (!pendingBackup) {
      return
    }

    setIsRestoring(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await restoreBackup(pendingBackup)

      setPendingBackup(null)
      setPendingFileName(null)
      setSuccessMessage('Backup restaurado. Los datos locales actuales fueron reemplazados y la app ya quedó usable con el contenido importado.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falló la restauración del backup local.')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <PageSection
      description="Exportá una copia JSON versionada o importá un archivo local validado. Nada de cloud, nada de sync raro: todo queda bajo tu control en este dispositivo."
      eyebrow="Utilidad local"
      title="Respaldo y restore"
      titleId="backup-title"
    >
      <div className="backup-stack">
        <Card as="article" className="backup-card">
          <div className="backup-card__header">
            <div>
              <h3 className="routine-card-title">Exportar backup JSON</h3>
              <p className="routine-summary">Incluye appState, rutinas, catálogo de ejercicios y sesiones en un archivo local versionado.</p>
            </div>
            <span className="status-pill status-pill--active">Local only</span>
          </div>

          <BackupCounts counts={currentData} title="Datos actuales en este dispositivo" />

          <Button disabled={isExporting} fullWidth size="touch" onClick={handleExport}>
            {isExporting ? 'Exportando backup...' : 'Exportar backup'}
          </Button>
        </Card>

        <Card as="article" className="backup-card">
          <div className="backup-card__header">
            <div>
              <h3 className="routine-card-title">Importar backup local</h3>
              <p className="routine-summary">Primero validamos estructura y versión. Recién después te dejamos confirmar el reemplazo destructivo.</p>
            </div>
            <span className="status-pill status-pill--paused">Validación previa</span>
          </div>

          <input
            ref={fileInputRef}
            accept="application/json,.json"
            aria-label="Seleccionar archivo de backup"
            className="backup-file-input"
            type="file"
            onChange={handleImportSelection}
          />

          <div className="backup-actions-row">
            <Button fullWidth size="touch" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Elegir archivo JSON
            </Button>
          </div>

          {pendingBackup && pendingCounts ? (
            <Card as="section" className="backup-preview-card" aria-labelledby="backup-preview-title" variant="highlight">
              <div className="backup-card__header">
                <div>
                  <p className="eyebrow">Archivo validado</p>
                  <h3 className="section-title" id="backup-preview-title">
                    Listo para restaurar
                  </h3>
                  <p className="empty-note backup-file-name">{pendingFileName ?? 'Backup local cargado'}</p>
                </div>
                <span className="status-pill status-pill--active">v{pendingBackup.version}</span>
              </div>

              <StatusBanner className="backup-warning" tone="warning">
                OJO: si confirmás, GymTracker reemplaza tus datos locales actuales por este backup. No hay merge ni cloud salvadora.
              </StatusBanner>

              <p className="empty-note">Exportado: {formatBackupDate(pendingBackup.exportedAt)}</p>
              <BackupCounts counts={pendingCounts} title="Contenido del backup importado" />

              <div className="backup-actions-row backup-actions-row--stacked">
                <Button disabled={isRestoring} fullWidth size="touch" variant="danger" onClick={handleRestore}>
                  {isRestoring ? 'Restaurando backup...' : 'Sí, reemplazar mis datos locales'}
                </Button>
                <Button
                  disabled={isRestoring}
                  fullWidth
                  size="touch"
                  variant="ghost"
                  onClick={() => {
                    setPendingBackup(null)
                    setPendingFileName(null)
                  }}
                >
                  Cancelar restore
                </Button>
              </div>
            </Card>
          ) : null}
        </Card>

        {!pendingBackup ? (
          <EmptyState
            description="Elegí un archivo JSON exportado por GymTracker y recién después vas a ver la previsualización con confirmación destructiva."
            title="Todavía no cargaste un backup"
          />
        ) : null}

        {errorMessage ? <StatusBanner tone="error">{errorMessage}</StatusBanner> : null}

        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}
      </div>
    </PageSection>
  )
}

function BackupCounts({ counts, title }: { counts: ReturnType<typeof getBackupEntityCounts>; title: string }) {
  return (
    <div className="backup-counts" aria-label={title}>
      <div className="meta-card backup-count-card">
        <strong>{counts.appState}</strong>
        <span>appState</span>
      </div>
      <div className="meta-card backup-count-card">
        <strong>{counts.routines}</strong>
        <span>rutinas</span>
      </div>
      <div className="meta-card backup-count-card">
        <strong>{counts.exerciseCatalog}</strong>
        <span>catálogo</span>
      </div>
      <div className="meta-card backup-count-card">
        <strong>{counts.sessions}</strong>
        <span>sesiones</span>
      </div>
    </div>
  )
}

function formatBackupDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}
