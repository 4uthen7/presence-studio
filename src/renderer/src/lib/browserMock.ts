import type { AppState, PresenceStudioApi, RpcStatus } from '../../../shared/types'
import { createSeedState } from './seed'

const STORAGE_KEY = 'presence-studio-browser-state'

function load(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AppState) : null
  } catch {
    return null
  }
}

export function installBrowserMock(): void {
  const noop = (): void => undefined
  const unsubscribe = (): (() => void) => () => undefined
  const disconnected: RpcStatus = {
    state: 'disconnected',
    message: 'ブラウザプレビューでは Discord に接続できません。デスクトップアプリで起動してください。'
  }

  const api: PresenceStudioApi = {
    window: {
      minimize: noop,
      toggleMaximize: noop,
      close: noop,
      onMaximizedChange: unsubscribe
    },
    store: {
      load: async () => load() ?? createSeedState(),
      save: async (state) => {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
          return true
        } catch {
          return false
        }
      },
      export: async () => null,
      import: async () => null,
      openDataFolder: async () => undefined,
      reset: async () => {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    },
    rpc: {
      connect: async (appId) => ({
        state: 'error',
        appId,
        message: 'ブラウザプレビューでは Discord IPC を利用できません。'
      }),
      disconnect: async () => undefined,
      setActivity: async () => disconnected,
      clear: async () => undefined,
      status: async () => disconnected,
      onStatus: unsubscribe
    },
    widget: {
      publish: async () => ({
        ok: false,
        status: 0,
        message: 'ブラウザプレビューでは公開できません。デスクトップアプリから実行してください。'
      }),
      tokenStatus: async () => ({ hasToken: false, storage: 'none' }),
      clearToken: async () => undefined,
      openExternal: async (url) => {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    },
    dialog: {
      pickImage: async () => null
    },
    system: {
      getInfo: async () => ({
        version: '0.2.0',
        platform: 'browser-preview',
        dataPath: 'localStorage'
      }),
      setLaunchAtLogin: async (enabled) => enabled,
      setMinimizeToTray: async (enabled) => enabled,
      setHotkey: async (enabled) => enabled,
      refreshTray: noop,
      onNavigate: unsubscribe,
      onTogglePresence: unsubscribe,
      onPersonaSwitch: unsubscribe
    }
  }

  window.presenceStudio = api
}
