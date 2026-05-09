import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { ThemeProvider } from '../../app/theme'
import { MorePage } from './MorePage'

describe('MorePage theme settings', () => {
  it('lets the user switch between dark and light theme', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ThemeProvider>
          <MorePage />
        </ThemeProvider>
      </MemoryRouter>,
    )

    const themeSwitch = screen.getByRole('switch', { name: /activar tema claro|desactivar tema claro/i })

    expect(themeSwitch).toHaveAttribute('aria-checked', 'false')

    await user.click(themeSwitch)

    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(themeSwitch).toHaveAttribute('aria-checked', 'true')
  })
})
