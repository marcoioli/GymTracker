import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { getCurrentWeekFrequencySummary, getWeeklyVolumeSummaries } from '../../domain/analytics'
import { db } from '../../db/database'
import { Card, EmptyState, PageSection } from '../../shared/ui'

export function MorePage() {
  const routines = useLiveQuery(() => db.routines.toArray(), [], [])
  const sessions = useLiveQuery(() => db.sessions.orderBy('endedAt').reverse().toArray(), [], [])
  const activeRoutine = useMemo(() => routines.find((routine) => routine.status === 'active') ?? null, [routines])
  const weeklyFrequency = getCurrentWeekFrequencySummary(sessions)
  const weeklyVolume = getWeeklyVolumeSummaries(sessions, 1)[0]?.totalVolume ?? 0
  const streak = getCurrentStreak(sessions)

  return (
    <>
      <PageSection
        description="Analytics, backup y estado general de la app."
        eyebrow="More"
        title="More"
        titleId="more-title"
      >
        <Card as="article" className="profile-spotlight-card" variant="highlight">
          <div className="profile-spotlight-card__header">
            <div className="profile-avatar" aria-hidden="true">
              GT
            </div>
            <div>
              <p className="eyebrow">Modo actual</p>
              <h3 className="routine-card-title">{activeRoutine ? activeRoutine.name : 'Sin rutina activa'}</h3>
              <p className="routine-summary">
                {activeRoutine
                  ? `Racha ${streak} días · ${weeklyFrequency.sessionCount} sesiones esta semana`
                  : 'Activá una rutina para destrabar inicio rápido, métricas más útiles y mejor contexto de progreso.'}
              </p>
            </div>
          </div>

          <div className="more-summary-grid">
            <MetricChip label="Sesiones" value={`${sessions.length}`} />
            <MetricChip label="Racha" value={`${streak}d`} />
            <MetricChip label="Volumen" value={`${Math.round(weeklyVolume).toLocaleString('es-AR')} kg`} />
          </div>
        </Card>
      </PageSection>

      <PageSection
        description="Módulos reales disponibles ahora mismo."
        title="Módulos disponibles"
        titleId="more-modules-title"
      >
        <div className="more-module-stack">
          <ModuleLink
            description="Frecuencia, volumen, adherencia y progreso por ejercicio con datos reales de sesiones guardadas."
            eyebrow="Métricas"
            to="/analytics"
            title="Progreso y tendencias"
          />

          <ModuleLink
            description="Exportá o restaurá tus datos locales con validación previa y sin depender de cloud."
            eyebrow="Respaldo"
            to="/backup"
            title="Guardar y recuperar datos"
          />
        </div>
      </PageSection>

      <PageSection title="Próximas extensiones" titleId="more-future-title">
        {routines.length === 0 && sessions.length === 0 ? (
          <EmptyState
            description="Cuando empieces a cargar más uso real, esta sección es donde mejor va a crecer Perfil, Objetivos, Configuración y Ayuda."
            title="El hub ya está listo para escalar"
          />
        ) : (
          <div className="future-module-grid" role="list" aria-label="Módulos futuros todavía no implementados">
            {['Perfil', 'Objetivos', 'Configuración', 'Ayuda'].map((label) => (
              <Card as="article" className="future-module-card" key={label} role="listitem">
                <strong>{label}</strong>
                <span>Todavía no implementado</span>
              </Card>
            ))}
          </div>
        )}
      </PageSection>
    </>
  )
}

function ModuleLink({ description, eyebrow, title, to }: { description: string; eyebrow: string; title: string; to: string }) {
  return (
    <Link className="module-link-card" to={to}>
      <span className="eyebrow">{eyebrow}</span>
      <strong className="routine-card-title">{title}</strong>
      <span className="routine-summary">{description}</span>
      <span className="module-link-card__arrow" aria-hidden="true">
        ↗
      </span>
    </Link>
  )
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-chip">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function getCurrentStreak(sessions: Array<{ endedAt: string }>): number {
  const uniqueDays = Array.from(new Set(sessions.map((session) => session.endedAt.slice(0, 10)))).sort((a, b) => b.localeCompare(a))

  if (uniqueDays.length === 0) {
    return 0
  }

  let streak = 0
  let expectedDate = new Date(`${uniqueDays[0]}T00:00:00.000Z`)

  for (const day of uniqueDays) {
    const current = new Date(`${day}T00:00:00.000Z`)

    if (current.toISOString().slice(0, 10) !== expectedDate.toISOString().slice(0, 10)) {
      break
    }

    streak += 1
    expectedDate.setUTCDate(expectedDate.getUTCDate() - 1)
  }

  return streak
}
