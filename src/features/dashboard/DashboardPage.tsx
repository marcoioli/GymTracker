import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { getSuggestedRoutineDay } from '../../domain/routines'
import { Button, Card, EmptyState, PageSection, StatusBanner } from '../../shared/ui'
import { getActiveRoutine } from '../routines/routinesRepository'
import { ConfirmWorkoutDayModal } from '../session/ConfirmWorkoutDayModal'
import { getWorkoutDayLabel } from '../session/sessionRepository'

export function DashboardPage() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const activeRoutine = useLiveQuery(() => getActiveRoutine(), [], undefined)
  const suggestedDay = activeRoutine ? getSuggestedRoutineDay(activeRoutine) : null
  const sessionSaved = searchParams.get('sessionSaved')
  const sessionSavedMessage = useMemo(() => {
    if (sessionSaved === 'completed') {
      return 'Sesión finalizada y guardada. Tu progreso ya quedó persistido en este dispositivo.'
    }

    if (sessionSaved === 'ended-early') {
      return 'Sesión guardada como terminada antes. El snapshot quedó visible en tu historial.'
    }

    return null
  }, [sessionSaved])

  return (
    <>
      <PageSection
        description={
          activeRoutine
            ? suggestedDay
              ? `Próximo sugerido: ${getWorkoutDayLabel(suggestedDay)}. Entrás, confirmás y registrás la sesión sin pelearte con la UI.`
              : 'La rutina activa todavía no tiene días entrenables. Volvé a Rutinas y definí al menos un día con ejercicios.'
            : 'Primero armá o activá una rutina. Recién ahí tiene sentido mostrarte un CTA real para entrenar.'
        }
        eyebrow={activeRoutine ? 'Rutina activa' : 'Estado de hoy'}
        title={activeRoutine ? `Rutina activa: ${activeRoutine.name}` : 'Hoy todavía no hay rutina activa'}
        titleId="home-summary-title"
      >
        {sessionSavedMessage ? (
          <StatusBanner tone="success">{sessionSavedMessage}</StatusBanner>
        ) : null}

        {activeRoutine && suggestedDay ? (
          <Card as="article" className="dashboard-highlight-card" variant="highlight">
            <div className="day-option__meta">
              <strong>{getWorkoutDayLabel(suggestedDay)}</strong>
              <span className="status-pill status-pill--active">Listo para arrancar</span>
            </div>
            <p className="routine-summary">Confirmá el día y cargá la sesión con una sola mano, sin perder el contexto del progreso.</p>
          </Card>
        ) : activeRoutine ? (
          <EmptyState
            className="dashboard-highlight-card"
            description="Esta rutina está activa, pero todavía no tiene un día realmente entrenable. Definí al menos un ejercicio para desbloquear el inicio."
            title="Falta un día usable"
          />
        ) : null}

        <Button
          disabled={activeRoutine ? !suggestedDay : false}
          fullWidth
          size="touch"
          onClick={() => (activeRoutine ? setIsModalOpen(true) : navigate('/routines'))}
        >
          {activeRoutine ? 'Iniciar entrenamiento' : 'Crear o activar rutina'}
        </Button>
      </PageSection>

      <PageSection title="Base del dashboard" titleId="kpis-title">
        <div className="kpi-grid">
          <Card as="article" className="kpi-card">
            <div className="kpi-label">Modo</div>
            <div className="kpi-value">Offline</div>
          </Card>
          <Card as="article" className="kpi-card">
            <div className="kpi-label">Persistencia</div>
            <div className="kpi-value">Dexie</div>
          </Card>
          <Card as="article" className="kpi-card">
            <div className="kpi-label">Usuario</div>
            <div className="kpi-value">Solo vos</div>
          </Card>
          <Card as="article" className="kpi-card">
            <div className="kpi-label">Enfoque</div>
            <div className="kpi-value">Rápido</div>
          </Card>
        </div>
      </PageSection>

      {activeRoutine && isModalOpen ? (
        <ConfirmWorkoutDayModal
          key={`${activeRoutine.id}:${activeRoutine.progress.currentWeekIndex}:${activeRoutine.progress.lastCompletedDayId ?? 'none'}`}
          routine={activeRoutine}
          onClose={() => setIsModalOpen(false)}
          onConfirm={({ weekIndex, dayId }) => {
            setIsModalOpen(false)
            navigate(`/session/${activeRoutine.id}/${weekIndex}/${dayId}?startedAt=${encodeURIComponent(new Date().toISOString())}`)
          }}
        />
      ) : null}
    </>
  )
}
