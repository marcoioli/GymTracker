import { render, screen } from '@testing-library/react'

import { EmptyState } from './EmptyState'
import { Field, FieldInput, StatusBanner } from './index'

describe('shared UI primitives', () => {
  it('renders consistent field labeling and feedback semantics', () => {
    render(
      <>
        <Field hint="Solo números enteros" htmlFor="weeks" label="Cantidad de semanas">
          <FieldInput id="weeks" type="number" value="2" readOnly />
        </Field>
        <StatusBanner tone="success">Guardado</StatusBanner>
        <StatusBanner tone="error">Error</StatusBanner>
        <EmptyState description="Todavía no hay sesiones." title="Sin historial" />
      </>
    )

    expect(screen.getByLabelText(/cantidad de semanas/i)).toHaveValue(2)
    expect(screen.getByText(/solo números enteros/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/guardado/i)
    expect(screen.getByRole('alert')).toHaveTextContent(/error/i)
    expect(screen.getByText(/sin historial/i)).toBeInTheDocument()
    expect(screen.getByText(/todavía no hay sesiones/i)).toBeInTheDocument()
  })
})
