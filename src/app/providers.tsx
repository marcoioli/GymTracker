import type { PropsWithChildren } from 'react'

import { PwaRuntimeBridge } from './pwa-runtime'
import { ThemeProvider } from './theme'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <PwaRuntimeBridge />
      {children}
    </ThemeProvider>
  )
}
