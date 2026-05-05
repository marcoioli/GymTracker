import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AppErrorBoundary } from './error-boundary'

function CrashOnDemand({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error('fallo de prueba')
  }

  return <p>Vista estable</p>
}

describe('AppErrorBoundary', () => {
  it('shows recovery UI and lets the user retry', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    function Harness() {
      const [shouldCrash, setShouldCrash] = React.useState(true)

      return (
        <>
          <button type="button" onClick={() => setShouldCrash(false)}>
            Desactivar error
          </button>
          <AppErrorBoundary>
            <CrashOnDemand shouldCrash={shouldCrash} />
          </AppErrorBoundary>
        </>
      )
    }

    render(<Harness />)

    expect(screen.getByRole('heading', { name: /la app encontro un error inesperado/i })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/fallo de prueba/i)

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(screen.getByRole('heading', { name: /la app encontro un error inesperado/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /desactivar error/i }))
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(screen.getByText(/vista estable/i)).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
