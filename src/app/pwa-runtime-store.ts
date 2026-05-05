import { useSyncExternalStore } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>

type PwaRuntimeState = {
  installPromptEvent: BeforeInstallPromptEvent | null
  isAppInstalled: boolean
  isInstallPromptDismissed: boolean
  isOfflineReadyVisible: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  updateServiceWorker: UpdateServiceWorker | null
}

const listeners = new Set<() => void>()

let hasBootstrappedPwa = false

let runtimeState: PwaRuntimeState = {
  installPromptEvent: null,
  isAppInstalled: false,
  isInstallPromptDismissed: false,
  isOfflineReadyVisible: false,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  isUpdateAvailable: false,
  updateServiceWorker: null
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function setRuntimeState(patch: Partial<PwaRuntimeState>) {
  runtimeState = { ...runtimeState, ...patch }
  emitChange()
}

export function subscribeRuntime(listener: () => void) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

function getSnapshot() {
  return runtimeState
}

export function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const displayModeMatches = typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)').matches : false

  return displayModeMatches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export async function promptInstall() {
  const event = runtimeState.installPromptEvent

  if (!event) {
    return
  }

  await event.prompt()

  const choice = await event.userChoice

  setRuntimeState({
    installPromptEvent: null,
    isAppInstalled: choice.outcome === 'accepted' || isStandaloneMode(),
    isInstallPromptDismissed: choice.outcome === 'dismissed'
  })
}

export async function applyUpdate() {
  const updateServiceWorker = runtimeState.updateServiceWorker

  if (!updateServiceWorker) {
    return
  }

  await updateServiceWorker(true)
}

export function dismissInstallPrompt() {
  setRuntimeState({ installPromptEvent: null, isInstallPromptDismissed: true })
}

export function dismissOfflineReady() {
  setRuntimeState({ isOfflineReadyVisible: false })
}

export function dismissUpdatePrompt() {
  setRuntimeState({ isUpdateAvailable: false })
}

export async function bootstrapPwaRegistration() {
  if (hasBootstrappedPwa || typeof window === 'undefined' || import.meta.env.MODE === 'test') {
    return
  }

  hasBootstrappedPwa = true

  try {
    const { registerSW } = await import('virtual:pwa-register')
    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        setRuntimeState({ isUpdateAvailable: true })
      },
      onOfflineReady() {
        setRuntimeState({ isOfflineReadyVisible: true })
      }
    })

    setRuntimeState({ updateServiceWorker })
  } catch {
    hasBootstrappedPwa = false
  }
}

export function usePwaRuntime() {
  const state = useSyncExternalStore(subscribeRuntime, getSnapshot, getSnapshot)

  return {
    ...state,
    applyUpdate,
    canInstall: !state.isAppInstalled && !state.isInstallPromptDismissed && state.installPromptEvent !== null,
    dismissInstallPrompt,
    dismissOfflineReady,
    dismissUpdatePrompt,
    promptInstall
  }
}
