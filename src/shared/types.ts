export type ViewId = 'studio' | 'widgets' | 'profiles' | 'library' | 'settings'

export type ActivityType = 'playing' | 'listening' | 'watching' | 'competing'

export type PresenceBlockKind =
  | 'details'
  | 'state'
  | 'largeImage'
  | 'smallImage'
  | 'timestamp'
  | 'party'
  | 'buttons'
  | 'statusDisplay'

export interface PresenceBlock {
  id: string
  kind: PresenceBlockKind
  enabled: boolean
}

export interface PresenceButton {
  id: string
  label: string
  url: string
}

export type TimestampMode = 'none' | 'elapsed' | 'countdown'

export interface PresenceConfig {
  enabled: boolean
  activityType: ActivityType
  details: string
  state: string
  largeImage: string
  largeImageText: string
  largeImageMode: 'asset' | 'url'
  smallImage: string
  smallImageText: string
  smallImageMode: 'asset' | 'url'
  timestampMode: TimestampMode
  startISO: string
  endISO: string
  partyEnabled: boolean
  partyId: string
  partyCurrent: string
  partyMax: string
  buttons: PresenceButton[]
  statusDisplay: 0 | 1 | 2
  blocks: PresenceBlock[]
}

export type BadgeId =
  | 'nitro'
  | 'boost'
  | 'early'
  | 'dev'
  | 'verified'
  | 'hypesquad'
  | 'quest'
  | 'bug'

export interface ProfileLink {
  id: string
  label: string
  url: string
}

export interface Persona {
  id: string
  name: string
  handle: string
  pronouns: string
  bio: string
  avatar: string
  banner: string
  accent: string
  badges: BadgeId[]
  links: ProfileLink[]
  userId: string
  location: string
  timezone: string
  createdAt: string
}

export type WidgetBlockKind =
  | 'eyebrow'
  | 'title'
  | 'subtitle'
  | 'text'
  | 'image'
  | 'avatar'
  | 'stat'
  | 'progress'
  | 'link'
  | 'badge'
  | 'divider'

export type WidgetZone = 'hero' | 'body'
export type WidgetSpan = 3 | 4 | 6 | 8 | 12
export type WidgetValueType = 'text' | 'number' | 'image'

export interface WidgetBlock {
  id: string
  kind: WidgetBlockKind
  zone: WidgetZone
  span: WidgetSpan
  source: 'static' | 'dynamic'
  field: string
  value: string
  valueType: WidgetValueType
  label: string
  align: 'left' | 'center'
  tone: 'default' | 'muted' | 'accent' | 'white'
  max: number
}

export interface WidgetMetaEntry {
  id: string
  key: string
  value: string
}

export interface WidgetPrimary {
  season: string
  rank_name: string
  highest_rank: string
  playtime_hours: string
  total_wins: string
  total_games: string
  server_name: string
  user_id: string
}

export interface WidgetConfig {
  layout: 'hero' | 'contained'
  accent: string
  heroImage: string
  blocks: WidgetBlock[]
  metadata: WidgetMetaEntry[]
  usernameSource: 'persona' | 'handle' | 'custom'
  customUsername: string
  primary: WidgetPrimary
  lastPublishedAt: string
}

export interface Asset {
  id: string
  name: string
  value: string
  kind: 'image' | 'key'
  createdAt: string
}

export interface PublishLogEntry {
  id: string
  at: string
  appId: string
  status: 'success' | 'error'
  message: string
}

export interface Settings {
  appId: string
  previewAppName: string
  userId: string
  redirectUri: string
  autoConnect: boolean
  minimizeToTray: boolean
  launchAtLogin: boolean
  hotkeyEnabled: boolean
  accent: string
  reduceMotion: boolean
  density: 'comfortable' | 'compact'
  refreshSeconds: number
}

export interface AppState {
  version: 1
  personas: Persona[]
  activePersonaId: string
  presence: PresenceConfig
  widget: WidgetConfig
  settings: Settings
  assets: Asset[]
  publishLog: PublishLogEntry[]
}

export type RpcState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface RpcStatus {
  state: RpcState
  message?: string
  appId?: string
  since?: number
  user?: {
    id: string
    username: string
    discriminator?: string
    avatar?: string
  }
}

export interface RpcActivity {
  type: number
  details?: string
  state?: string
  startTimestamp?: number
  endTimestamp?: number
  largeImageKey?: string
  largeImageText?: string
  smallImageKey?: string
  smallImageText?: string
  partyId?: string
  partySize?: number
  partyMax?: number
  buttons?: Array<{ label: string; url: string }>
  instance?: boolean
  statusDisplayType?: number
}

export interface PublishRequest {
  appId: string
  userId: string
  token?: string
  rememberToken: boolean
  payload: unknown
}

export interface PublishResponse {
  ok: boolean
  status: number
  message: string
  body?: string
}

export interface SecureTokenStatus {
  hasToken: boolean
  storage: 'dpapi' | 'none'
}

export interface ImagePickResult {
  dataUrl: string
  name: string
  width: number
  height: number
}

export interface PresenceStudioApi {
  window: {
    minimize: () => void
    toggleMaximize: () => void
    close: () => void
    onMaximizedChange: (callback: (maximized: boolean) => void) => () => void
  }
  store: {
    load: () => Promise<AppState | null>
    save: (state: AppState) => Promise<boolean>
    export: (state: AppState) => Promise<string | null>
    import: () => Promise<AppState | null>
    openDataFolder: () => Promise<void>
    reset: () => Promise<void>
  }
  rpc: {
    connect: (appId: string) => Promise<RpcStatus>
    disconnect: () => Promise<void>
    setActivity: (appId: string, activity: RpcActivity) => Promise<RpcStatus>
    clear: () => Promise<void>
    status: () => Promise<RpcStatus>
    onStatus: (callback: (status: RpcStatus) => void) => () => void
  }
  widget: {
    publish: (request: PublishRequest) => Promise<PublishResponse>
    tokenStatus: () => Promise<SecureTokenStatus>
    clearToken: () => Promise<void>
    openExternal: (url: string) => Promise<void>
  }
  dialog: {
    pickImage: () => Promise<ImagePickResult | null>
  }
  system: {
    getInfo: () => Promise<{ version: string; platform: string; dataPath: string }>
    setLaunchAtLogin: (enabled: boolean) => Promise<boolean>
    setMinimizeToTray: (enabled: boolean) => Promise<boolean>
    setHotkey: (enabled: boolean) => Promise<boolean>
    refreshTray: (personas: Array<{ id: string; name: string }>, activeId: string, live: boolean) => void
    onNavigate: (callback: (view: ViewId) => void) => () => void
    onTogglePresence: (callback: () => void) => () => void
    onPersonaSwitch: (callback: (personaId: string) => void) => () => void
  }
}
