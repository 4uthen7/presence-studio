import { useEffect, useRef, useState } from 'react'
import { TitleBar } from './components/TitleBar'
import { Rail } from './components/Rail'
import { StatusBar } from './components/StatusBar'
import { Toasts } from './components/Toasts'
import { CommandPalette } from './components/CommandPalette'
import { PublishModal } from './components/PublishModal'
import { PersonaEditor } from './components/PersonaEditor'
import { QuickConnectModal } from './components/QuickConnectModal'
import { StudioView } from './views/StudioView'
import { WidgetsView } from './views/WidgetsView'
import { ProfilesView } from './views/ProfilesView'
import { LibraryView } from './views/LibraryView'
import { SettingsView } from './views/SettingsView'
import { useAppStore, toPersistedState } from './store/appStore'
import { toast, useUiStore } from './store/uiStore'
import { usePresenceEngine } from './hooks/usePresenceEngine'
import { toggleLive } from './lib/live'
import { useMounted } from './lib/hooks'
import type { ViewId } from '../../shared/types'
import iconUrl from './assets/icon-256.png'

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const parsed = Number.parseInt(full, 16)
  if (!Number.isFinite(parsed)) return '139, 124, 255'
  return `${(parsed >> 16) & 255}, ${(parsed >> 8) & 255}, ${parsed & 255}`
}

function Splash(): React.JSX.Element {
  return (
    <div className="splash">
      <div className="splash-inner">
        <img className="splash-mark" src={iconUrl} alt="" />
        <div style={{ textAlign: 'center' }}>
          <div className="splash-name">Presence Studio</div>
          <div className="splash-hint">Compose your signal</div>
        </div>
        <div className="splash-bar" />
      </div>
    </div>
  )
}

export default function App(): React.JSX.Element {
  const hydrated = useAppStore((state) => state.hydrated)
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const accent = useAppStore((state) => state.settings.accent)
  const reduceMotion = useAppStore((state) => state.settings.reduceMotion)
  const density = useAppStore((state) => state.settings.density)
  const minimizeToTray = useAppStore((state) => state.settings.minimizeToTray)
  const launchAtLogin = useAppStore((state) => state.settings.launchAtLogin)
  const hotkeyEnabled = useAppStore((state) => state.settings.hotkeyEnabled)
  const personas = useAppStore((state) => state.personas)
  const activePersonaId = useAppStore((state) => state.activePersonaId)
  const presenceEnabled = useAppStore((state) => state.presence.enabled)
  const [bootError, setBootError] = useState<string | null>(null)
  const splashElapsed = useMounted(620)
  const savingRef = useRef<number | null>(null)
  const hotkeyWarned = useRef(false)

  usePresenceEngine()

  useEffect(() => {
    const boot = async (): Promise<void> => {
      try {
        const loaded = await window.presenceStudio.store.load()
        useAppStore.getState().hydrate(loaded)
      } catch (error) {
        setBootError(error instanceof Error ? error.message : 'データを読み込めませんでした。')
        useAppStore.getState().hydrate(null)
      }

      const params = new URLSearchParams(window.location.search)
      if (params.get('motion') === '0') {
        const style = document.createElement('style')
        style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'
        document.head.appendChild(style)
      }
      const view = params.get('view')
      if (view && ['studio', 'widgets', 'profiles', 'library', 'settings'].includes(view)) {
        setView(view as ViewId)
      }
      if (params.get('palette') === '1') useUiStore.getState().setCommandOpen(true)
      if (params.get('publish') === '1') useUiStore.getState().setPublishOpen(true)
      if (params.get('persona') === '1') {
        useUiStore.getState().setPersonaEditor(useAppStore.getState().activePersonaId)
      }
    }
    void boot()
  }, [setView])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
    document.documentElement.style.setProperty('--accent-rgb', hexToRgb(accent))
  }, [accent])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    document.documentElement.classList.toggle('compact', density === 'compact')
  }, [reduceMotion, density])

  useEffect(() => {
    if (!hydrated) return
    const unsubscribe = useAppStore.subscribe((state) => {
      if (!state.hydrated) return
      if (savingRef.current) window.clearTimeout(savingRef.current)
      useUiStore.getState().setSaveStatus('saving')
      savingRef.current = window.setTimeout(async () => {
        try {
          await window.presenceStudio.store.save(toPersistedState(state))
          useUiStore.getState().setSaveStatus('saved')
        } catch {
          useUiStore.getState().setSaveStatus('error')
        }
        window.presenceStudio.system.refreshTray(
          state.personas.map((persona) => ({ id: persona.id, name: persona.name })),
          state.activePersonaId,
          state.presence.enabled
        )
      }, 450)
    })
    return () => {
      unsubscribe()
      if (savingRef.current) window.clearTimeout(savingRef.current)
    }
  }, [hydrated])

  useEffect(() => {
    if (!hydrated) return
    window.presenceStudio.system.refreshTray(
      personas.map((persona) => ({ id: persona.id, name: persona.name })),
      activePersonaId,
      presenceEnabled
    )
  }, [hydrated, personas, activePersonaId, presenceEnabled])

  useEffect(() => {
    if (!hydrated) return
    void window.presenceStudio.system.setMinimizeToTray(minimizeToTray)
  }, [hydrated, minimizeToTray])

  useEffect(() => {
    if (!hydrated) return
    void window.presenceStudio.system.setLaunchAtLogin(launchAtLogin)
  }, [hydrated, launchAtLogin])

  useEffect(() => {
    if (!hydrated) return
    void window.presenceStudio.system.setHotkey(hotkeyEnabled).then((ok) => {
      if (!ok && hotkeyEnabled && !hotkeyWarned.current) {
        hotkeyWarned.current = true
        toast('warn', 'グローバルホットキーを登録できません', 'Ctrl+Shift+P は他のアプリが使用している可能性があります。')
      }
    })
  }, [hydrated, hotkeyEnabled])

  useEffect(() => {
    if (!hydrated) return
    const unsubNavigate = window.presenceStudio.system.onNavigate((next) => setView(next))
    const unsubToggle = window.presenceStudio.system.onTogglePresence(() => {
      void toggleLive()
    })
    const unsubPersona = window.presenceStudio.system.onPersonaSwitch((personaId) => {
      const state = useAppStore.getState()
      const persona = state.personas.find((item) => item.id === personaId)
      if (!persona) return
      state.setActivePersona(personaId)
      toast('info', `${persona.name} に切り替えました`, state.presence.enabled ? 'Presence を更新しています。' : undefined)
    })
    return () => {
      unsubNavigate()
      unsubToggle()
      unsubPersona()
    }
  }, [hydrated, setView])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const mod = event.ctrlKey || event.metaKey
      if (!mod) return
      if (event.key.toLowerCase() === 'k') {
        event.preventDefault()
        useUiStore.getState().setCommandOpen(true)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        void toggleLive()
        return
      }
      if (/^[1-5]$/.test(event.key)) {
        event.preventDefault()
        const views = ['studio', 'widgets', 'profiles', 'library', 'settings'] as const
        setView(views[Number(event.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setView])

  if (!hydrated || !splashElapsed) return <Splash />

  return (
    <div className="app">
      <div className="app-noise" />
      <TitleBar />
      <div className="app-body">
        <Rail />
        <main className="workspace">
          <div className="workspace-scroll">
            {view === 'studio' && <StudioView />}
            {view === 'widgets' && <WidgetsView />}
            {view === 'profiles' && <ProfilesView />}
            {view === 'library' && <LibraryView />}
            {view === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
      <StatusBar />
      <Toasts />
      <CommandPalette />
      <PublishModal />
      <PersonaEditor />
      <QuickConnectModal />
      {bootError && (
        <div className="boot-error" onClick={() => setBootError(null)}>
          起動時のデータ読み込みに失敗しました: {bootError}
        </div>
      )}
    </div>
  )
}
