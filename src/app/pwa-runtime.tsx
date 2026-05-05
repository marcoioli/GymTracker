import { useEffect } from 'react'

import { Button, StatusBanner } from '../shared/ui'
import {
  bootstrapPwaRegistration,
  isStandaloneMode,
  setRuntimeState,
  usePwaRuntime
} from './pwa-runtime-store'

export function PwaRuntimeBridge() {
  useEffect(() => {
    void bootstrapPwaRegistration()

    const handleOnline = () => setRuntimeState({ isOnline: true })
    const handleOffline = () => setRuntimeState({ isOnline: false })
    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent

      installEvent.preventDefault()

      if (isStandaloneMode()) {
        setRuntimeState({ installPromptEvent: null, isAppInstalled: true, isInstallPromptDismissed: false })
        return
      }

      setRuntimeState({
        installPromptEvent: installEvent,
        isAppInstalled: false,
        isInstallPromptDismissed: false
      })
    }
    const handleAppInstalled = () => {
      setRuntimeState({
        installPromptEvent: null,
        isAppInstalled: true,
        isInstallPromptDismissed: false
      })
    }

    setRuntimeState({ isAppInstalled: isStandaloneMode(), isOnline: navigator.onLine })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return null
}

export function AppStatusDeck() {
  const {
    applyUpdate,
    canInstall,
    dismissInstallPrompt,
    dismissOfflineReady,
    dismissUpdatePrompt,
    isOfflineReadyVisible,
    isOnline,
    isUpdateAvailable,
    promptInstall
  } = usePwaRuntime()

  if (!canInstall && !isOfflineReadyVisible && isOnline && !isUpdateAvailable) {
    return null
  }

  return (
    <section aria-label="Estado de la aplicacion" className="app-status-stack">
      {!isOnline ? (
        <StatusBanner tone="warning">
          <div className="ui-status-banner__content">
            <strong>Sin conexion.</strong>
            <span>Podes seguir usando los datos locales ya guardados en este dispositivo.</span>
          </div>
        </StatusBanner>
      ) : null}

      {isUpdateAvailable ? (
        <StatusBanner tone="info">
          <div className="ui-status-banner__content">
            <strong>Hay una version nueva lista.</strong>
            <span>Recarga cuando quieras para aplicar la actualizacion del shell sin perder tu base local.</span>
          </div>
          <div className="ui-status-banner__actions">
            <Button size="compact" variant="secondary" onClick={() => void applyUpdate()}>
              Actualizar ahora
            </Button>
            <Button size="compact" variant="ghost" onClick={dismissUpdatePrompt}>
              Mas tarde
            </Button>
          </div>
        </StatusBanner>
      ) : null}

      {canInstall ? (
        <StatusBanner tone="success">
          <div className="ui-status-banner__content">
            <strong>Instala GymTracker.</strong>
            <span>Vas a abrirlo como app y el acceso offline queda mas directo cuando entrenas.</span>
          </div>
          <div className="ui-status-banner__actions">
            <Button size="compact" variant="secondary" onClick={() => void promptInstall()}>
              Instalar app
            </Button>
            <Button size="compact" variant="ghost" onClick={dismissInstallPrompt}>
              Ocultar
            </Button>
          </div>
        </StatusBanner>
      ) : null}

      {isOfflineReadyVisible ? (
        <StatusBanner tone="success">
          <div className="ui-status-banner__content">
            <strong>Modo offline listo.</strong>
            <span>La app ya puede reutilizar su shell sin conexion y seguir trabajando con la data local.</span>
          </div>
          <div className="ui-status-banner__actions">
            <Button size="compact" variant="ghost" onClick={dismissOfflineReady}>
              Entendido
            </Button>
          </div>
        </StatusBanner>
      ) : null}
    </section>
  )
}
