import { render, screen } from '@testing-library/react'

import { App } from './App'

describe('App foundation', () => {
  it('renders the initial dashboard empty state', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: /saltar al contenido/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /hola/i })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('button', { name: /ir a rutinas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rutinas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /más/i })).toBeInTheDocument()
  })
})
