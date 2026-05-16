import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../db/database'
import { Card } from '../../shared/ui'

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'

function getWeekMonday(anchor: Date): Date {
  const current = new Date(anchor)
  current.setHours(12, 0, 0, 0)
  const day = getArgentinaWeekdayIndex(current)
  const diff = day === 0 ? -6 : 1 - day
  current.setDate(current.getDate() + diff)
  return current
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatArgentinaDateKey(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value)
}

function getArgentinaWeekdayIndex(value: Date) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIME_ZONE,
    weekday: 'short'
  }).format(value)

  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
}

export function TrackerWeekOverview() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], [])

  const trainedDays = useMemo(() => {
    if (!sessions || sessions.length === 0) return new Set<string>()

    const today = new Date()
    const monday = getWeekMonday(today)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const trainedSet = new Set<string>()
    for (const session of sessions) {
      const endedAt = new Date(session.endedAt)
      if (
        endedAt >= monday &&
        endedAt <= sunday &&
        (session.status === 'completed' || session.status === 'ended-early')
      ) {
        trainedSet.add(formatArgentinaDateKey(endedAt))
      }
    }

    return trainedSet
  }, [sessions])

  const today = new Date()
  const currentDayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: ARGENTINA_TIME_ZONE
  }).format(today)

  const monday = getWeekMonday(today)
  const todayKey = formatArgentinaDateKey(today)

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday)
    current.setDate(monday.getDate() + index)
    const dateKey = formatArgentinaDateKey(current)
    const isToday = dateKey === todayKey

    const weekdayLabel = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      timeZone: ARGENTINA_TIME_ZONE
    }).format(current)

    return {
      id: dateKey,
      isToday,
      letter: new Intl.DateTimeFormat('es-AR', {
        weekday: 'short',
        timeZone: ARGENTINA_TIME_ZONE
      })
        .format(current)
        .slice(0, 1)
        .toUpperCase(),
      dayNumber: new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        timeZone: ARGENTINA_TIME_ZONE
      }).format(current),
      weekdayLabel
    }
  })

  return (
    <Card as="article" className="tracker-week-overview">
      <div className="tracker-week-overview__header">
        <div>
          <p className="eyebrow">Semana actual</p>
          <h3 className="routine-card-title">{capitalize(currentDayLabel)}</h3>
        </div>
        <span className="tracker-week-overview__today-pill">Hoy</span>
      </div>

      <div className="tracker-week-overview__days" aria-label="Días de la semana actual">
        {weekDays.map((day) => {
          const isTrained = trainedDays.has(day.id)
          const classNames = [
            'tracker-week-overview__day',
            day.isToday ? 'is-today' : '',
            isTrained ? 'is-trained' : ''
          ]
            .filter(Boolean)
            .join(' ')

          const ariaLabel = `${capitalize(day.weekdayLabel)} ${day.dayNumber}${isTrained ? ', entrenado' : ''}`

          return (
            <div className={classNames} key={day.id} aria-label={ariaLabel}>
              <span>{day.letter}</span>
              <strong>{day.dayNumber}</strong>
              {isTrained ? (
                <span className="tracker-week-overview__checkmark" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
