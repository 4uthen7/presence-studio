import type {
  AppState,
  Persona,
  PresenceBlock,
  PresenceBlockKind,
  PresenceConfig,
  WidgetBlock,
  WidgetBlockKind,
  WidgetConfig,
  WidgetSpan,
  WidgetZone
} from '../../../shared/types'
import { makeArtwork, makeAvatar, makeBanner } from './art'

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`

export interface PresenceBlockDef {
  kind: PresenceBlockKind
  label: string
  english: string
  description: string
  category: 'Text' | 'Media' | 'Meta' | 'Actions'
}

export const PRESENCE_BLOCK_DEFS: PresenceBlockDef[] = [
  {
    kind: 'details',
    label: '詳細',
    english: 'Details',
    description: 'アクティビティの1行目',
    category: 'Text'
  },
  {
    kind: 'state',
    label: 'ステータス',
    english: 'State',
    description: 'アクティビティの2行目',
    category: 'Text'
  },
  {
    kind: 'largeImage',
    label: 'ラージ画像',
    english: 'Large image',
    description: 'メインのアートワーク',
    category: 'Media'
  },
  {
    kind: 'smallImage',
    label: 'スモール画像',
    english: 'Small image',
    description: 'アートワークのバッジ',
    category: 'Media'
  },
  {
    kind: 'timestamp',
    label: 'タイマー',
    english: 'Timestamp',
    description: '経過時間 / カウントダウン',
    category: 'Meta'
  },
  {
    kind: 'party',
    label: 'パーティ',
    english: 'Party',
    description: '人数とメンバー枠',
    category: 'Meta'
  },
  {
    kind: 'buttons',
    label: 'ボタン',
    english: 'Buttons',
    description: 'プロフィールから開けるリンク',
    category: 'Actions'
  },
  {
    kind: 'statusDisplay',
    label: '表示モード',
    english: 'Status display',
    description: '名前 / 詳細 / ステータスの表示切替',
    category: 'Meta'
  }
]

export const PRESENCE_BLOCK_MAP = Object.fromEntries(
  PRESENCE_BLOCK_DEFS.map((definition) => [definition.kind, definition])
) as Record<PresenceBlockKind, PresenceBlockDef>

export const VALID_PRESENCE_KINDS = new Set(PRESENCE_BLOCK_DEFS.map((definition) => definition.kind))

export function makePresenceBlock(kind: PresenceBlockKind): PresenceBlock {
  return { id: uid(), kind, enabled: true }
}

export interface WidgetBlockDef {
  kind: WidgetBlockKind
  label: string
  english: string
  description: string
  category: 'Text' | 'Media' | 'Data'
}

export const WIDGET_BLOCK_DEFS: WidgetBlockDef[] = [
  { kind: 'eyebrow', label: 'アイブロウ', english: 'Eyebrow', description: '小さな見出しラベル', category: 'Text' },
  { kind: 'title', label: 'タイトル', english: 'Title', description: 'ウィジェットの主役テキスト', category: 'Text' },
  { kind: 'subtitle', label: 'サブタイトル', english: 'Subtitle', description: '補足の1行', category: 'Text' },
  { kind: 'text', label: 'テキスト', english: 'Text', description: '本文・説明文', category: 'Text' },
  { kind: 'image', label: '画像', english: 'Image', description: 'カバー・スクリーンショット', category: 'Media' },
  { kind: 'avatar', label: 'アバター', english: 'Avatar', description: '丸いプロフィール画像', category: 'Media' },
  { kind: 'stat', label: 'スタット', english: 'Stat', description: '数値とラベルのタイル', category: 'Data' },
  { kind: 'progress', label: 'プログレス', english: 'Progress', description: '達成度・再生位置', category: 'Data' },
  { kind: 'badge', label: 'バッジ', english: 'Badge', description: 'サービス名などのタグ', category: 'Data' },
  { kind: 'link', label: 'リンク', english: 'Link', description: '外部ページへの導線', category: 'Data' },
  { kind: 'divider', label: '区切り線', english: 'Divider', description: '余白をつくる線', category: 'Text' }
]

export const WIDGET_BLOCK_MAP = Object.fromEntries(
  WIDGET_BLOCK_DEFS.map((definition) => [definition.kind, definition])
) as Record<WidgetBlockKind, WidgetBlockDef>

export const VALID_WIDGET_KINDS = new Set(WIDGET_BLOCK_DEFS.map((definition) => definition.kind))

export function makeWidgetBlock(
  kind: WidgetBlockKind,
  zone: WidgetZone = 'body',
  overrides: Partial<WidgetBlock> = {}
): WidgetBlock {
  const base: WidgetBlock = {
    id: uid(),
    kind,
    zone,
    span: kind === 'stat' ? 4 : kind === 'badge' ? 3 : 6,
    source: 'dynamic',
    field: kind,
    value: '',
    valueType: kind === 'image' || kind === 'avatar' ? 'image' : kind === 'stat' || kind === 'progress' ? 'number' : 'text',
    label: '',
    align: 'left',
    tone: 'default',
    max: 100
  }

  switch (kind) {
    case 'eyebrow':
      base.value = 'NOW SHOWING'
      base.field = 'eyebrow'
      base.tone = 'accent'
      break
    case 'title':
      base.value = 'Your title'
      base.field = 'title'
      break
    case 'subtitle':
      base.value = 'A supporting line'
      base.field = 'subtitle'
      base.tone = 'muted'
      break
    case 'text':
      base.value = 'A short description that gives this widget some context.'
      base.source = 'static'
      base.field = 'text'
      break
    case 'image':
      base.value = ''
      base.field = 'image'
      base.span = 12
      break
    case 'avatar':
      base.value = ''
      base.field = 'avatar'
      base.span = 3
      break
    case 'stat':
      base.label = 'STAT'
      base.value = '42'
      base.field = 'stat'
      break
    case 'progress':
      base.label = 'Progress'
      base.value = '64'
      base.field = 'progress'
      base.span = 6
      break
    case 'badge':
      base.value = 'BADGE'
      base.source = 'static'
      base.field = 'badge'
      base.tone = 'accent'
      base.span = 3
      break
    case 'link':
      base.label = 'Open link'
      base.value = 'https://discord.com'
      base.field = 'link'
      base.span = 6
      break
    case 'divider':
      base.source = 'static'
      base.field = ''
      base.span = 12
      break
    default:
      break
  }

  return { ...base, ...overrides }
}

function person(
  id: string,
  name: string,
  handle: string,
  pronouns: string,
  bio: string,
  accent: string,
  secondary: string,
  badges: Persona['badges'],
  links: Persona['links'],
  location: string,
  createdAt: string
): Persona {
  return {
    id,
    name,
    handle,
    pronouns,
    bio,
    avatar: makeAvatar(name, accent, secondary),
    banner: makeBanner(name, accent, secondary),
    accent,
    badges,
    links,
    userId: '',
    location,
    timezone: 'Asia/Tokyo',
    createdAt
  }
}

export function createDefaultPresence(): PresenceConfig {
  const start = new Date(Date.now() - 42 * 60 * 1000).toISOString()
  const end = new Date(Date.now() + 78 * 60 * 1000).toISOString()
  const blocks: PresenceBlock[] = [
    makePresenceBlock('largeImage'),
    makePresenceBlock('smallImage'),
    makePresenceBlock('details'),
    makePresenceBlock('state'),
    makePresenceBlock('timestamp'),
    makePresenceBlock('party'),
    makePresenceBlock('buttons'),
    makePresenceBlock('statusDisplay')
  ]

  return {
    enabled: false,
    activityType: 'listening',
    details: 'Neon District — Chapter 04',
    state: 'Rain on the windshield · 88.1 FM',
    largeImage: '',
    largeImageText: 'Night Drive OST',
    largeImageMode: 'asset',
    smallImage: '',
    smallImageText: 'Lossless',
    smallImageMode: 'asset',
    timestampMode: 'elapsed',
    startISO: start,
    endISO: end,
    partyEnabled: true,
    partyId: '',
    partyCurrent: '2',
    partyMax: '4',
    buttons: [
      { id: uid(), label: 'Listen along', url: 'https://open.spotify.com' },
      { id: uid(), label: 'View route', url: 'https://maps.google.com' }
    ],
    statusDisplay: 0,
    blocks
  }
}

export function createDefaultWidget(): WidgetConfig {
  const blocks: WidgetBlock[] = [
    makeWidgetBlock('eyebrow', 'hero', { value: 'NOW SCROBBLING', field: 'eyebrow', tone: 'accent' }),
    makeWidgetBlock('title', 'hero', { value: 'Midnight City', field: 'track' }),
    makeWidgetBlock('subtitle', 'hero', {
      value: 'M83 · Hurry Up, We’re Dreaming',
      field: 'artist',
      tone: 'muted'
    }),
    makeWidgetBlock('badge', 'hero', { value: 'LAST.FM', field: 'source', tone: 'white' }),
    makeWidgetBlock('stat', 'body', { label: 'SCROBBLES', value: '12,480', field: 'scrobbles', span: 4 }),
    makeWidgetBlock('stat', 'body', { label: 'ARTISTS', value: '842', field: 'artists', span: 4 }),
    makeWidgetBlock('stat', 'body', { label: 'DAY STREAK', value: '26', field: 'streak', span: 4 }),
    makeWidgetBlock('progress', 'body', {
      label: 'Album progress',
      value: '72',
      field: 'album_progress',
      span: 6
    }),
    makeWidgetBlock('link', 'body', {
      label: 'Open Last.fm',
      value: 'https://www.last.fm/user/aster',
      span: 6
    })
  ]

  return {
    layout: 'hero',
    accent: '#8b7cff',
    heroImage: makeArtwork('midnight-city', '#8b7cff', '#ff7ac8'),
    blocks,
    metadata: [
      { id: uid(), key: 'source', value: 'last.fm' },
      { id: uid(), key: 'profile', value: 'last.fm/user/aster' }
    ],
    usernameSource: 'persona',
    customUsername: 'aster',
    primary: {
      season: '',
      rank_name: '',
      highest_rank: '',
      playtime_hours: '',
      total_wins: '',
      total_games: '',
      server_name: '',
      user_id: ''
    },
    lastPublishedAt: ''
  }
}

export function createSeedState(): AppState {
  const personas: Persona[] = [
    person(
      'persona-aster',
      'Aster',
      'aster',
      'they/them',
      'Building small worlds after midnight. Coffee → code → repeat. Currently obsessed with synthwave, slow trains, and interfaces that feel alive.',
      '#8b7cff',
      '#ff7ac8',
      ['nitro', 'early', 'dev'],
      [
        { id: uid(), label: 'portfolio', url: 'https://example.com' },
        { id: uid(), label: 'github', url: 'https://github.com' }
      ],
      'Tokyo, JP',
      '2021-04-18T12:00:00.000Z'
    ),
    person(
      'persona-noctis',
      'Noctis',
      'noctis',
      'he/him',
      'Ranked grinder. Clip hoarder. Probably in a queue right now. Ask me about aim curves.',
      '#5eead4',
      '#3b82f6',
      ['boost', 'quest'],
      [{ id: uid(), label: 'twitch', url: 'https://twitch.tv' }],
      'Osaka, JP',
      '2020-11-02T12:00:00.000Z'
    ),
    person(
      'persona-rook',
      'Rook',
      'rook',
      'she/her',
      'Film photography, mechanical keyboards, and very long walks. Currently editing a roll from Shimokita.',
      '#ff7ac8',
      '#8b5cf6',
      ['hypesquad', 'verified'],
      [
        { id: uid(), label: 'letterboxd', url: 'https://letterboxd.com' },
        { id: uid(), label: 'photos', url: 'https://example.com' }
      ],
      'Yokohama, JP',
      '2022-08-09T12:00:00.000Z'
    )
  ]

  return {
    version: 1,
    personas,
    activePersonaId: personas[0].id,
    presence: createDefaultPresence(),
    widget: createDefaultWidget(),
    settings: {
      appId: '',
      previewAppName: 'Midnight Drive',
      previewAppIcon: '',
      userId: '',
      redirectUri: 'https://discord.com/',
      autoConnect: true,
      minimizeToTray: true,
      launchAtLogin: false,
      hotkeyEnabled: true,
      accent: '#8b7cff',
      reduceMotion: false,
      density: 'comfortable',
      refreshSeconds: 60
    },
    assets: [
      {
        id: uid(),
        name: 'Night Drive cover',
        value: makeArtwork('night-drive-cover', '#8b7cff', '#ff7ac8'),
        kind: 'image',
        createdAt: new Date().toISOString()
      },
      {
        id: uid(),
        name: 'App icon asset',
        value: 'app_icon',
        kind: 'key',
        createdAt: new Date().toISOString()
      },
      {
        id: uid(),
        name: 'Waveform small',
        value: 'waveform_small',
        kind: 'key',
        createdAt: new Date().toISOString()
      }
    ],
    publishLog: []
  }
}

export const WIDGET_SPANS: WidgetSpan[] = [3, 4, 6, 8, 12]
