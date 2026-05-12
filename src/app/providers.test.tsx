import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from './providers'

describe('AppProviders splash boot flow', () => {
  const originalRequestAnimationFrame = window.requestAnimationFrame
  const originalCancelAnimationFrame = window.cancelAnimationFrame

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(window.performance, 'now').mockReturnValue(200)
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }
    window.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    window.requestAnimationFrame = originalRequestAnimationFrame
    window.cancelAnimationFrame = originalCancelAnimationFrame
  })

  it('waits for the minimum visible time before hiding the launch splash', () => {
    const splashScreen = document.createElement('div')
    splashScreen.id = 'app-launch-splash'
    document.body.appendChild(splashScreen)
    ;(window as Window & { __treinoSplashStart?: number }).__treinoSplashStart = 0

    render(
      <AppProviders>
        <div>Treino listo</div>
      </AppProviders>
    )

    expect(screen.getByText('Treino listo')).not.toBeNull()
    expect(document.getElementById('app-launch-splash')).toBe(splashScreen)

    vi.advanceTimersByTime(219)
    expect(splashScreen.getAttribute('data-state')).toBeNull()

    vi.advanceTimersByTime(1)
    expect(splashScreen.getAttribute('data-state')).toBe('hidden')

    vi.advanceTimersByTime(240)
    expect(document.getElementById('app-launch-splash')).toBeNull()
  })
})
