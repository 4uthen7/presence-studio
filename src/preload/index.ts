import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppState,
  ImagePickResult,
  PresenceStudioApi,
  PublishRequest,
  PublishResponse,
  RpcActivity,
  RpcStatus,
  SecureTokenStatus,
  ViewId
} from '../shared/types'

function subscribe<T>(channel: string, callback: (value: T) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, value: T): void => callback(value)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: PresenceStudioApi = {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    close: () => ipcRenderer.send('window:close'),
    onMaximizedChange: (callback: (maximized: boolean) => void) =>
      subscribe<boolean>('window:maximized', callback)
  },
  store: {
    load: () => ipcRenderer.invoke('store:load') as Promise<AppState | null>,
    save: (state: AppState) => ipcRenderer.invoke('store:save', state) as Promise<boolean>,
    export: (state: AppState) => ipcRenderer.invoke('store:export', state) as Promise<string | null>,
    import: () => ipcRenderer.invoke('store:import') as Promise<AppState | null>,
    openDataFolder: () => ipcRenderer.invoke('store:open-data-folder') as Promise<void>,
    reset: () => ipcRenderer.invoke('store:reset') as Promise<void>
  },
  rpc: {
    connect: (appId: string) => ipcRenderer.invoke('rpc:connect', appId) as Promise<RpcStatus>,
    disconnect: () => ipcRenderer.invoke('rpc:disconnect') as Promise<void>,
    setActivity: (appId: string, activity: RpcActivity) =>
      ipcRenderer.invoke('rpc:set-activity', appId, activity) as Promise<RpcStatus>,
    clear: () => ipcRenderer.invoke('rpc:clear') as Promise<void>,
    status: () => ipcRenderer.invoke('rpc:status') as Promise<RpcStatus>,
    onStatus: (callback: (status: RpcStatus) => void) => subscribe<RpcStatus>('rpc:status', callback)
  },
  widget: {
    publish: (request: PublishRequest) =>
      ipcRenderer.invoke('widget:publish', request) as Promise<PublishResponse>,
    tokenStatus: () => ipcRenderer.invoke('widget:token-status') as Promise<SecureTokenStatus>,
    clearToken: () => ipcRenderer.invoke('widget:clear-token') as Promise<void>,
    openExternal: (url: string) => ipcRenderer.invoke('widget:open-external', url) as Promise<void>
  },
  dialog: {
    pickImage: () => ipcRenderer.invoke('dialog:pick-image') as Promise<ImagePickResult | null>
  },
  system: {
    getInfo: () =>
      ipcRenderer.invoke('system:get-info') as Promise<{
        version: string
        platform: string
        dataPath: string
      }>,
    setLaunchAtLogin: (enabled: boolean) =>
      ipcRenderer.invoke('system:set-launch-at-login', enabled) as Promise<boolean>,
    setMinimizeToTray: (enabled: boolean) =>
      ipcRenderer.invoke('system:set-minimize-to-tray', enabled) as Promise<boolean>,
    setHotkey: (enabled: boolean) =>
      ipcRenderer.invoke('system:set-hotkey', enabled) as Promise<boolean>,
    refreshTray: (personas, activeId, live) =>
      ipcRenderer.send('system:refresh-tray', personas, activeId, live),
    onNavigate: (callback: (view: ViewId) => void) => subscribe<ViewId>('system:navigate', callback),
    onTogglePresence: (callback: () => void) =>
      subscribe<void>('system:toggle-presence', () => callback()),
    onPersonaSwitch: (callback: (personaId: string) => void) =>
      subscribe<string>('system:persona-switch', callback)
  }
}

contextBridge.exposeInMainWorld('presenceStudio', api)
