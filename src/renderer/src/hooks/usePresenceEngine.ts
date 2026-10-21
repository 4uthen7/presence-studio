import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { useUiStore } from '../store/uiStore'
import { buildActivity } from '../lib/presence'
import { goLive, pushPresenceSilently } from '../lib/live'

export function usePresenceEngine(): void {
  const hydrated = useAppStore((state) => state.hydrated)
  const appId = useAppStore((state) => state.settings.appId)
  const refreshSeconds = useAppStore((state) => state.settings.refreshSeconds)
  const presence = useAppStore((state) => state.presence)
  const activePersonaId = useAppStore((state) => state.activePersonaId)
  const personas = useAppStore((state) => state.personas)
  const setRpcStatus = useUiStore((state) => state.setRpcStatus)
  const lastSignature = useRef('')
  const bootRef = useRef(false)

  useEffect(() => {
    const unsubscribe = window.presenceStudio.rpc.onStatus((status) => {
      setRpcStatus(status)
    })
    void window.presenceStudio.rpc.status().then((status) => setRpcStatus(status))
    return unsubscribe
  }, [setRpcStatus])

  useEffect(() => {
    if (!hydrated || bootRef.current) return
    bootRef.current = true
    const boot = async (): Promise<void> => {
      const state = useAppStore.getState()
      if (state.settings.appId && state.settings.autoConnect) {
        const status = await window.presenceStudio.rpc.connect(state.settings.appId)
        setRpcStatus(status)
      }
      if (state.presence.enabled && state.settings.appId && state.settings.autoConnect) {
        window.setTimeout(() => {
          void goLive({ silent: true })
        }, 900)
      } else if (state.presence.enabled && !state.settings.autoConnect) {
        state.updatePresence({ enabled: false })
      }
    }
    void boot()
  }, [hydrated, setRpcStatus])

  useEffect(() => {
    if (!hydrated || !presence.enabled || !appId) return
    const persona = personas.find((item) => item.id === activePersonaId) ?? personas[0]
    const build = buildActivity(presence, persona)
    if (!build.activity) return
    const signature = JSON.stringify(build.activity)
    if (signature === lastSignature.current) return

    const timer = window.setTimeout(() => {
      lastSignature.current = signature
      void window.presenceStudio.rpc
        .setActivity(appId, build.activity!)
        .then((status) => setRpcStatus(status))
        .catch(() => undefined)
    }, 650)

    return () => window.clearTimeout(timer)
  }, [hydrated, presence, appId, activePersonaId, personas, setRpcStatus])

  useEffect(() => {
    if (!hydrated || !presence.enabled || !appId) return
    const interval = window.setInterval(
      () => {
        void pushPresenceSilently()
      },
      Math.max(15, refreshSeconds) * 1000
    )
    return () => window.clearInterval(interval)
  }, [hydrated, presence.enabled, appId, refreshSeconds])
}
