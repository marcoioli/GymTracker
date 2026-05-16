import { useMemo, useState } from 'react'

import { getSuggestedRoutineDay, listRoutineDaySelections, listTrainableRoutineDaySelections, type Routine } from '../../domain/routines'
import { Button } from '../../shared/ui'
import { getWorkoutDayLabel } from './sessionRepository'

type ConfirmWorkoutDayModalProps = {
  routine: Routine
  onClose: () => void
  onConfirm: (payload: { weekIndex: number; dayId: string }) => void
}

export function ConfirmWorkoutDayModal({ routine, onClose, onConfirm }: ConfirmWorkoutDayModalProps) {
  const suggestedDay = useMemo(() => getSuggestedRoutineDay(routine), [routine])
  const options = useMemo(() => listTrainableRoutineDaySelections(routine), [routine])
  const [selectedKey, setSelectedKey] = useState(() => toSelectionKey(suggestedDay ?? options[0] ?? null))

  if (options.length === 0) {
    return null
  }

  const selectedOption = options.find((option) => toSelectionKey(option) === selectedKey) ?? suggestedDay ?? options[0]
  const overrideOptions = options.filter((option) => toSelectionKey(option) !== toSelectionKey(suggestedDay))

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-labelledby="confirm-workout-day-title"
        aria-modal="true"
        className="modal-sheet"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow modal-eyebrow">Listo para entrenar</p>
            <h2 className="section-title" id="confirm-workout-day-title">
              Confirmá el día
            </h2>
          </div>

          <button aria-label="Cerrar confirmación" className="ghost-button" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <Button fullWidth size="touch" onClick={() => onConfirm({ weekIndex: selectedOption.weekIndex, dayId: selectedOption.day.id })}>
          Iniciar {selectedOption.day.label}
        </Button>

        <div className="day-option-list" role="radiogroup" aria-label="Días disponibles para iniciar sesión">
          {suggestedDay ? (
            <div className="day-option-list__section">
              <p className="session-group-label">Sugerido para hoy</p>
              <DayOption
                isSelected={toSelectionKey(suggestedDay) === toSelectionKey(selectedOption)}
                isSuggested
                option={suggestedDay}
                onSelect={setSelectedKey}
              />
            </div>
          ) : null}

          {overrideOptions.length > 0 ? (
            <div className="day-option-list__section">
              <p className="session-group-label">Cambiar manualmente</p>
              <div className="day-option-list day-option-list--nested">
                {overrideOptions.map((option) => (
                  <DayOption
                    isSelected={toSelectionKey(option) === toSelectionKey(selectedOption)}
                    key={toSelectionKey(option)}
                    option={option}
                    onSelect={setSelectedKey}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  )
}

function DayOption({
  isSelected,
  isSuggested = false,
  option,
  onSelect
}: {
  isSelected: boolean
  isSuggested?: boolean
   option: ReturnType<typeof listRoutineDaySelections>[number]
  onSelect: (value: string) => void
}) {
  return (
    <label className={`day-option${isSelected ? ' day-option--selected' : ''}${isSuggested ? ' day-option--suggested' : ''}`}>
      <input
        checked={isSelected}
        className="sr-only"
        name="workout-day"
        type="radio"
        value={toSelectionKey(option)}
        onChange={() => onSelect(toSelectionKey(option))}
      />
      <div>
        <div className="day-option__meta">
          <strong>{getWorkoutDayLabel(option)}</strong>
          {isSuggested ? <span className="status-pill status-pill--active">Recomendado</span> : null}
        </div>
        <span className="empty-note">
          {option.day.exercises.length} ejercicios planificados
          {isSuggested ? ' · seguí el progreso sugerido sin pensar de más.' : ''}
        </span>
      </div>
    </label>
  )
}

function toSelectionKey(selection: { weekIndex: number; day: { id: string } } | null): string {
  return selection ? `${selection.weekIndex}:${selection.day.id}` : ''
}
