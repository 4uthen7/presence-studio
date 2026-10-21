import type {
  ActivityType,
  PresenceBlockKind,
  TimestampMode,
  WidgetBlock,
  WidgetConfig
} from '../../../shared/types'
import { makeArtwork } from './art'
import { makeWidgetBlock, uid } from './seed'

export interface PresenceTemplate {
  id: string
  name: string
  description: string
  tag: string
  accent: string
  secondary: string
  activityType: ActivityType
  details: string
  state: string
  largeImageText: string
  smallImageText: string
  timestampMode: TimestampMode
  durationMinutes: number
  party: [number, number] | null
  buttons: Array<{ label: string; url: string }>
  blocks: PresenceBlockKind[]
}

export const PRESENCE_TEMPLATES: PresenceTemplate[] = [
  {
    id: 'night-drive',
    name: 'Night Drive',
    description: '雨の夜景、シンセウェーブ、静かなドライブ。Listening 向けの定番構成。',
    tag: 'LISTENING',
    accent: '#8b7cff',
    secondary: '#ff7ac8',
    activityType: 'listening',
    details: 'Neon District — Chapter 04',
    state: 'Rain on the windshield · 88.1 FM',
    largeImageText: 'Night Drive OST',
    smallImageText: 'Lossless',
    timestampMode: 'elapsed',
    durationMinutes: 42,
    party: [2, 4],
    buttons: [
      { label: 'Listen along', url: 'https://open.spotify.com' },
      { label: 'View route', url: 'https://maps.google.com' }
    ],
    blocks: ['largeImage', 'smallImage', 'details', 'state', 'timestamp', 'party', 'buttons', 'statusDisplay']
  },
  {
    id: 'ranked-climb',
    name: 'Ranked Climb',
    description: 'ランクとRR、キュー待ち。Competing のアクティビティをスポーティに。',
    tag: 'COMPETING',
    accent: '#ff6b81',
    secondary: '#f5c46b',
    activityType: 'competing',
    details: 'Ascendant II · 68 RR',
    state: 'Queueing for Ascent',
    largeImageText: 'Competitive',
    smallImageText: 'Duo queue',
    timestampMode: 'elapsed',
    durationMinutes: 12,
    party: [2, 5],
    buttons: [
      { label: 'Watch stream', url: 'https://twitch.tv' },
      { label: 'Match tracker', url: 'https://tracker.gg' }
    ],
    blocks: ['largeImage', 'smallImage', 'details', 'state', 'timestamp', 'party', 'buttons']
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    description: '集中タイマー付きの作業モード。カウントダウンで残り時間を共有。',
    tag: 'FOCUS',
    accent: '#62e6c4',
    secondary: '#5aa9ff',
    activityType: 'playing',
    details: 'Focus session · 90 min',
    state: 'Notifications muted · Lo-fi beats',
    largeImageText: 'Deep Work',
    smallImageText: 'In the zone',
    timestampMode: 'countdown',
    durationMinutes: 90,
    party: null,
    buttons: [{ label: 'Focus playlist', url: 'https://open.spotify.com' }],
    blocks: ['largeImage', 'smallImage', 'details', 'state', 'timestamp', 'buttons']
  },
  {
    id: 'movie-night',
    name: 'Movie Night',
    description: '視聴中の映画と再生時間。Party で一緒に見ている人数を表示。',
    tag: 'WATCHING',
    accent: '#f5c46b',
    secondary: '#ff7ac8',
    activityType: 'watching',
    details: 'Blade Runner 2049',
    state: '2h 44m · 4K HDR',
    largeImageText: 'Blade Runner 2049',
    smallImageText: 'Watch party',
    timestampMode: 'elapsed',
    durationMinutes: 68,
    party: [3, 4],
    buttons: [{ label: 'Join watch party', url: 'https://discord.com' }],
    blocks: ['largeImage', 'smallImage', 'details', 'state', 'timestamp', 'party', 'buttons']
  },
  {
    id: 'dev-session',
    name: 'Dev Session',
    description: '開発中のプロジェクトと作業内容。GitHub やドキュメントへの導線付き。',
    tag: 'BUILDING',
    accent: '#5aa9ff',
    secondary: '#8b7cff',
    activityType: 'playing',
    details: 'presence-studio',
    state: 'Wiring the RPC bridge',
    largeImageText: 'Presence Studio',
    smallImageText: 'TypeScript',
    timestampMode: 'elapsed',
    durationMinutes: 26,
    party: null,
    buttons: [
      { label: 'GitHub', url: 'https://github.com' },
      { label: 'Docs', url: 'https://discord.com/developers/docs' }
    ],
    blocks: ['largeImage', 'smallImage', 'details', 'state', 'timestamp', 'buttons']
  }
]

export interface WidgetTemplate {
  id: string
  name: string
  description: string
  tag: string
  accent: string
  secondary: string
  layout: 'hero' | 'contained'
  createBlocks: () => WidgetBlock[]
  metadata: Array<{ key: string; value: string }>
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'lastfm',
    name: 'Last.fm Scrobbles',
    description: '再生中の曲、総スクロブル数、アーティスト数、連続日数を表示。',
    tag: 'MUSIC',
    accent: '#d9464b',
    secondary: '#ff7ac8',
    layout: 'hero',
    createBlocks: () => [
      makeWidgetBlock('eyebrow', 'hero', { value: 'NOW SCROBBLING', field: 'eyebrow', tone: 'accent' }),
      makeWidgetBlock('title', 'hero', { value: 'Midnight City', field: 'track' }),
      makeWidgetBlock('subtitle', 'hero', { value: 'M83 · Hurry Up, We’re Dreaming', field: 'artist', tone: 'muted' }),
      makeWidgetBlock('badge', 'hero', { value: 'LAST.FM', source: 'static', tone: 'white' }),
      makeWidgetBlock('stat', 'body', { label: 'SCROBBLES', value: '12,480', field: 'scrobbles', span: 4 }),
      makeWidgetBlock('stat', 'body', { label: 'ARTISTS', value: '842', field: 'artists', span: 4 }),
      makeWidgetBlock('stat', 'body', { label: 'DAY STREAK', value: '26', field: 'streak', span: 4 }),
      makeWidgetBlock('progress', 'body', { label: 'Album progress', value: '72', field: 'album_progress', span: 6 }),
      makeWidgetBlock('link', 'body', { label: 'Open Last.fm', value: 'https://www.last.fm/user/aster', span: 6 })
    ],
    metadata: [
      { key: 'source', value: 'last.fm' },
      { key: 'profile', value: 'last.fm/user/aster' }
    ]
  },
  {
    id: 'github',
    name: 'GitHub Activity',
    description: '今週のコミット、PR、レビュー、ストリークをコンパクトに。',
    tag: 'DEVELOPER',
    accent: '#8b7cff',
    secondary: '#62e6c4',
    layout: 'contained',
    createBlocks: () => [
      makeWidgetBlock('eyebrow', 'hero', { value: 'THIS WEEK', field: 'eyebrow', tone: 'accent' }),
      makeWidgetBlock('title', 'hero', { value: '24 commits', field: 'commits' }),
      makeWidgetBlock('subtitle', 'hero', { value: 'presence-studio · main', field: 'repo', tone: 'muted' }),
      makeWidgetBlock('stat', 'body', { label: 'PULL REQUESTS', value: '6', field: 'prs', span: 4 }),
      makeWidgetBlock('stat', 'body', { label: 'REVIEWS', value: '11', field: 'reviews', span: 4 }),
      makeWidgetBlock('stat', 'body', { label: 'STREAK', value: '18d', field: 'streak', span: 4 }),
      makeWidgetBlock('progress', 'body', { label: 'Weekly goal', value: '68', field: 'goal', span: 6 }),
      makeWidgetBlock('link', 'body', { label: 'View profile', value: 'https://github.com/aster', span: 6 })
    ],
    metadata: [
      { key: 'source', value: 'github' },
      { key: 'username', value: 'aster' }
    ]
  },
  {
    id: 'valorant',
    name: 'Valorant Rank',
    description: 'ランク、RR、勝率、直近の試合。Competing プロフィールに。',
    tag: 'GAMING',
    accent: '#ff6b81',
    secondary: '#f5c46b',
    layout: 'contained',
    createBlocks: () => [
      makeWidgetBlock('eyebrow', 'hero', { value: 'COMPETITIVE', field: 'mode', tone: 'accent' }),
      makeWidgetBlock('title', 'hero', { value: 'Ascendant II', field: 'rank' }),
      makeWidgetBlock('subtitle', 'hero', { value: '68 RR · 62% win rate', field: 'rr', tone: 'muted' }),
      makeWidgetBlock('stat', 'body', { label: 'K/D', value: '1.24', field: 'kd', span: 4 }),
      makeWidgetBlock('stat', 'body', { label: 'ACS', value: '248', field: 'acs', span: 4 }),
      makeWidgetBlock('stat', 'body', { label: 'MATCHES', value: '142', field: 'matches', span: 4 }),
      makeWidgetBlock('progress', 'body', { label: 'Next rank', value: '68', field: 'rank_progress', span: 12 })
    ],
    metadata: [
      { key: 'source', value: 'valorant' },
      { key: 'region', value: 'ap' }
    ]
  },
  {
    id: 'study',
    name: 'Study Streak',
    description: '勉強時間、連続日数、今日の目標。落ち着いた学習ログ。',
    tag: 'FOCUS',
    accent: '#62e6c4',
    secondary: '#5aa9ff',
    layout: 'hero',
    createBlocks: () => [
      makeWidgetBlock('eyebrow', 'hero', { value: 'TODAY’S FOCUS', field: 'eyebrow', tone: 'accent' }),
      makeWidgetBlock('title', 'hero', { value: '4h 12m', field: 'today' }),
      makeWidgetBlock('subtitle', 'hero', { value: 'Japanese · N2 grammar', field: 'subject', tone: 'muted' }),
      makeWidgetBlock('stat', 'body', { label: 'STREAK', value: '31d', field: 'streak', span: 4 }),
      makeWidgetBlock('stat', 'body', { label: 'THIS WEEK', value: '18h', field: 'week', span: 4 }),
      makeWidgetBlock('stat', 'body', { label: 'SESSIONS', value: '9', field: 'sessions', span: 4 }),
      makeWidgetBlock('progress', 'body', { label: 'Daily goal', value: '84', field: 'goal', span: 12 })
    ],
    metadata: [{ key: 'source', value: 'study-log' }]
  }
]

export function templateArt(template: { id: string; accent: string; secondary: string }): string {
  return makeArtwork(`template-${template.id}`, template.accent, template.secondary)
}

export function createWidgetFromTemplate(template: WidgetTemplate): Partial<WidgetConfig> {
  return {
    layout: template.layout,
    accent: template.accent,
    heroImage: templateArt(template),
    blocks: template.createBlocks(),
    metadata: template.metadata.map((entry) => ({ id: uid(), ...entry })),
    usernameSource: 'persona'
  }
}
