import type { PropsWithChildren } from 'react'

import { PwaRuntimeBridge } from './pwa-runtime'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      <PwaRuntimeBridge />
      {children}
    </>
  )
}
