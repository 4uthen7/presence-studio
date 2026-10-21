import type { ActivityType, PresenceBlockKind, PresenceConfig } from '../../../shared/types'
import { makeAvatar, makeArtwork } from './art'
import { createDefaultPresence, makePresenceBlock, uid } from './seed'

export type PresetCategory = 'games' | 'dev' | 'music' | 'creative'

export interface PresetButton {
  label: string
  url: string
}

export interface PresetAssetKey {
  key: string
  label: string
}

export interface SimulationPreset {
  id: string
  name: string
  appName: string
  category: PresetCategory
  tagline: string
  description: string
  accent: string
  secondary: string
  activityType: ActivityType
  details: string
  state: string
  largeKey: string
  largeText: string
  smallKey?: string
  smallText?: string
  party?: { current: number; max: number }
  buttons?: PresetButton[]
  statusDisplay?: 0 | 1 | 2
  offsetMinutes: number
  assetKeys: PresetAssetKey[]
}

export const CATEGORY_LABELS: Record<PresetCategory, string> = {
  games: 'GAMES',
  dev: 'DEV',
  music: 'MUSIC',
  creative: 'CREATIVE'
}

export const CATEGORY_LABELS_JA: Record<PresetCategory, string> = {
  games: 'ゲーム',
  dev: '開発ツール',
  music: '音楽',
  creative: 'クリエイティブ'
}

const p = (buttonList: Array<[string, string]>): PresetButton[] =>
  buttonList.map(([label, url]) => ({ label, url }))

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'valorant',
    name: 'VALORANT',
    appName: 'VALORANT',
    category: 'games',
    tagline: 'Competitive · Ascendant II · 3/5 party',
    description: 'ランク帯・RR・マップ・スコア・パーティ人数まで、試合中のVALORANTらしい構成。',
    accent: '#ff4655',
    secondary: '#ff8a5b',
    activityType: 'playing',
    details: 'Competitive // 7 - 5',
    state: 'In Party',
    largeKey: 'game_icon',
    largeText: 'Ascent',
    smallKey: 'rank_ascendant',
    smallText: 'Ascendant II — 68 RR',
    party: { current: 3, max: 5 },
    buttons: p([
      ['View rank', 'https://tracker.gg/valorant'],
      ['Match history', 'https://tracker.gg/valorant']
    ]),
    statusDisplay: 1,
    offsetMinutes: 28,
    assetKeys: [
      { key: 'game_icon', label: 'Large — Ascent / game icon' },
      { key: 'rank_ascendant', label: 'Small — Ascendant rank' }
    ]
  },
  {
    id: 'league',
    name: 'League of Legends',
    appName: 'League of Legends',
    category: 'games',
    tagline: 'Ranked Solo/Duo · Diamond II · 2/5 party',
    description: 'チャンピオン、KDA、ゲーム時間、ランクを並べたランク戦の構成。',
    accent: '#0ac8b9',
    secondary: '#c89b3c',
    activityType: 'playing',
    details: 'Ranked Solo/Duo // 24:18',
    state: 'Ahri · 8 / 2 / 11',
    largeKey: 'champion_ahri',
    largeText: 'Ahri',
    smallKey: 'rank_diamond',
    smallText: 'Diamond II — 54 LP',
    party: { current: 2, max: 5 },
    buttons: p([
      ['Live build', 'https://op.gg'],
      ['Match history', 'https://www.leagueoflegends.com']
    ]),
    statusDisplay: 2,
    offsetMinutes: 24,
    assetKeys: [
      { key: 'champion_ahri', label: 'Large — champion splash' },
      { key: 'rank_diamond', label: 'Small — Diamond rank' }
    ]
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    appName: 'Counter-Strike 2',
    category: 'games',
    tagline: 'Competitive · Mirage · 3/5 party',
    description: 'マップ・スコア・K/D/A・CT/Tを、CS2のGSI連携と同じ並びで再現。',
    accent: '#f5a623',
    secondary: '#5b8def',
    activityType: 'playing',
    details: 'Mirage - 11:9',
    state: 'K: 18 | D: 12 | A: 4',
    largeKey: 'de_mirage',
    largeText: 'Playing Competitive on Mirage',
    smallKey: 'ct',
    smallText: 'Playing CT',
    party: { current: 3, max: 5 },
    buttons: p([
      ['Match stats', 'https://leetify.com'],
      ['Watch CS2', 'https://www.counter-strike.net']
    ]),
    statusDisplay: 2,
    offsetMinutes: 36,
    assetKeys: [
      { key: 'de_mirage', label: 'Large — map' },
      { key: 'ct', label: 'Small — CT side' }
    ]
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    appName: 'Apex Legends',
    category: 'games',
    tagline: 'Ranked · Diamond IV · 2/3 squad',
    description: 'レジェンド、ダメージ、RP、スクワッド人数を表示するランク構成。',
    accent: '#da292a',
    secondary: '#f2a900',
    activityType: 'playing',
    details: 'Ranked // Diamond IV',
    state: 'Wraith · 1,842 damage',
    largeKey: 'legend_wraith',
    largeText: 'Wraith',
    smallKey: 'rank_diamond',
    smallText: 'Diamond IV — 7,240 RP',
    party: { current: 2, max: 3 },
    buttons: p([
      ['Legend stats', 'https://apex.tracker.gg'],
      ['Apex Legends', 'https://www.ea.com/games/apex-legends']
    ]),
    statusDisplay: 1,
    offsetMinutes: 17,
    assetKeys: [
      { key: 'legend_wraith', label: 'Large — legend' },
      { key: 'rank_diamond', label: 'Small — rank' }
    ]
  },
  {
    id: 'genshin',
    name: 'Genshin Impact',
    appName: 'Genshin Impact',
    category: 'games',
    tagline: 'AR 60 · Inazuma · Co-op 2/4',
    description: '旅人ランク、地域、世界レベル、パーティ編成を表示する探索中スタイル。',
    accent: '#6b8cff',
    secondary: '#b8e0ff',
    activityType: 'playing',
    details: 'Adventure Rank 60',
    state: 'Inazuma · World Level 8',
    largeKey: 'char_kamisato_ayaka',
    largeText: 'Playing as Kamisato Ayaka',
    smallKey: 'menu_paimon',
    smallText: 'Party: Ayaka · Kazuha · Kokomi · Shenhe',
    party: { current: 2, max: 4 },
    buttons: p([
      ['HoYoLAB', 'https://www.hoyolab.com'],
      ['Genshin Impact', 'https://genshin.hoyoverse.com']
    ]),
    statusDisplay: 2,
    offsetMinutes: 64,
    assetKeys: [
      { key: 'char_kamisato_ayaka', label: 'Large — character' },
      { key: 'menu_paimon', label: 'Small — Paimon' }
    ]
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    appName: 'Minecraft',
    category: 'games',
    tagline: 'Survival · SMP · Building',
    description: 'ワールド、ゲームモード、作業内容、装備を表示するサバイバル構成。',
    accent: '#62b447',
    secondary: '#9b7653',
    activityType: 'playing',
    details: 'Survival · SMP',
    state: 'Building a storage hall',
    largeKey: 'minecraft',
    largeText: 'Minecraft 1.21',
    smallKey: 'diamond_pickaxe',
    smallText: 'Diamond Pickaxe',
    buttons: p([
      ['Minecraft', 'https://www.minecraft.net'],
      ['Mods', 'https://modrinth.com']
    ]),
    statusDisplay: 2,
    offsetMinutes: 52,
    assetKeys: [
      { key: 'minecraft', label: 'Large — world / logo' },
      { key: 'diamond_pickaxe', label: 'Small — item' }
    ]
  },
  {
    id: 'osu',
    name: 'osu!',
    appName: 'osu!',
    category: 'games',
    tagline: 'osu!standard · #12,345 · 6,842pp',
    description: 'ランク、pp、精度、ルールセットを表示するosu!lazer風の構成。',
    accent: '#ff66aa',
    secondary: '#7b68ee',
    activityType: 'playing',
    details: 'osu!standard · #12,345',
    state: '6,842pp · 98.6%',
    largeKey: 'osu_logo_lazer',
    largeText: 'Aster (rank #12,345)',
    smallKey: 'mode_0',
    smallText: 'osu!standard',
    buttons: p([
      ['View profile', 'https://osu.ppy.sh'],
      ['Beatmaps', 'https://osu.ppy.sh/beatmapsets']
    ]),
    statusDisplay: 2,
    offsetMinutes: 11,
    assetKeys: [
      { key: 'osu_logo_lazer', label: 'Large — osu! logo' },
      { key: 'mode_0', label: 'Small — standard mode' }
    ]
  },
  {
    id: 'rocket-league',
    name: 'Rocket League',
    appName: 'Rocket League',
    category: 'games',
    tagline: 'Ranked Doubles · Champion I · 2/2',
    description: 'スコア、残り時間、ランク、パーティを表示する試合中スタイル。',
    accent: '#0078ff',
    secondary: '#ff8c00',
    activityType: 'competing',
    details: 'Ranked Doubles · 2 - 1',
    state: 'Champion I · 3:42 left',
    largeKey: 'rocket_league',
    largeText: 'Rocket League',
    smallKey: 'rank_champion',
    smallText: 'Champion I Div 3',
    party: { current: 2, max: 2 },
    buttons: p([
      ['Rank stats', 'https://rocketleague.tracker.network'],
      ['Rocket League', 'https://www.rocketleague.com']
    ]),
    statusDisplay: 1,
    offsetMinutes: 6,
    assetKeys: [
      { key: 'rocket_league', label: 'Large — arena / logo' },
      { key: 'rank_champion', label: 'Small — rank' }
    ]
  },
  {
    id: 'ffxiv',
    name: 'FINAL FANTASY XIV',
    appName: 'FINAL FANTASY XIV',
    category: 'games',
    tagline: 'Duty Finder · Warrior · 4/8 party',
    description: 'ジョブ、レベル、アイテムレベル、コンテンツ名を表示するパーティ構成。',
    accent: '#8b5cf6',
    secondary: '#f5c46b',
    activityType: 'playing',
    details: 'Duty Finder · The Burning Wall',
    state: 'Warrior · Item Level 650',
    largeKey: 'ffxiv',
    largeText: 'FINAL FANTASY XIV',
    smallKey: 'job_warrior',
    smallText: 'Warrior Lv. 90',
    party: { current: 4, max: 8 },
    buttons: p([
      ['Lodestone', 'https://na.finalfantasyxiv.com/lodestone/'],
      ['FFXIV', 'https://www.finalfantasyxiv.com']
    ]),
    statusDisplay: 2,
    offsetMinutes: 42,
    assetKeys: [
      { key: 'ffxiv', label: 'Large — key art' },
      { key: 'job_warrior', label: 'Small — job icon' }
    ]
  },
  {
    id: 'overwatch',
    name: 'Overwatch 2',
    appName: 'Overwatch 2',
    category: 'games',
    tagline: 'Competitive · Diamond 3 · Support',
    description: 'ロール、ヒーロー、ランク、チーム人数を表示する競技スタイル。',
    accent: '#f99e1a',
    secondary: '#5aa9ff',
    activityType: 'competing',
    details: 'Competitive · Diamond 3',
    state: 'Support · Kiriko',
    largeKey: 'hero_kiriko',
    largeText: 'Kiriko',
    smallKey: 'rank_diamond',
    smallText: 'Diamond 3 · Support',
    party: { current: 5, max: 5 },
    buttons: p([
      ['Hero stats', 'https://overwatch.blizzard.com'],
      ['Overwatch 2', 'https://overwatch.blizzard.com']
    ]),
    statusDisplay: 2,
    offsetMinutes: 21,
    assetKeys: [
      { key: 'hero_kiriko', label: 'Large — hero' },
      { key: 'rank_diamond', label: 'Small — rank' }
    ]
  },
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    appName: 'Visual Studio Code',
    category: 'dev',
    tagline: 'TypeScript · 2 problems · 2h 12m',
    description: 'VSCordの既定フォーマットに合わせた、ファイル・行・問題数・言語表示。',
    accent: '#007acc',
    secondary: '#23a8f2',
    activityType: 'playing',
    details: 'In presence-studio — 2 problems found',
    state: 'Working on App.tsx:42:8',
    largeKey: 'typescript',
    largeText: 'Editing a TypeScript file',
    smallKey: 'vscode',
    smallText: 'Visual Studio Code',
    buttons: p([
      ['View Repository', 'https://github.com/4uthen7/presence-studio'],
      ['VS Code', 'https://code.visualstudio.com']
    ]),
    statusDisplay: 1,
    offsetMinutes: 132,
    assetKeys: [
      { key: 'typescript', label: 'Large — language icon' },
      { key: 'vscode', label: 'Small — editor icon' }
    ]
  },
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    appName: 'IntelliJ IDEA',
    category: 'dev',
    tagline: 'Java · Spring Boot · Debugging',
    description: 'プロジェクト、ファイル、行、問題数、IDE名を並べた開発中スタイル。',
    accent: '#fe315d',
    secondary: '#5aa9ff',
    activityType: 'playing',
    details: 'In api-service — 0 problems found',
    state: 'Editing UserController.java:88',
    largeKey: 'java',
    largeText: 'Editing a Java file',
    smallKey: 'intellij_idea',
    smallText: 'IntelliJ IDEA',
    buttons: p([
      ['Spring', 'https://spring.io'],
      ['IntelliJ IDEA', 'https://www.jetbrains.com/idea/']
    ]),
    statusDisplay: 1,
    offsetMinutes: 76,
    assetKeys: [
      { key: 'java', label: 'Large — language icon' },
      { key: 'intellij_idea', label: 'Small — IDE icon' }
    ]
  },
  {
    id: 'figma',
    name: 'Figma',
    appName: 'Figma',
    category: 'creative',
    tagline: 'Designing · Widgets · 12 frames',
    description: 'ファイル名、ページ、フレーム数、選択内容を表示するデザイン中スタイル。',
    accent: '#a259ff',
    secondary: '#ff7262',
    activityType: 'playing',
    details: 'Designing — Presence Studio',
    state: 'Page: Widgets · 12 frames',
    largeKey: 'figma',
    largeText: 'Figma',
    smallKey: 'figma_design',
    smallText: 'Design',
    buttons: p([
      ['Open Figma', 'https://www.figma.com'],
      ['Community', 'https://www.figma.com/community']
    ]),
    statusDisplay: 2,
    offsetMinutes: 47,
    assetKeys: [
      { key: 'figma', label: 'Large — Figma' },
      { key: 'figma_design', label: 'Small — design' }
    ]
  },
  {
    id: 'blender',
    name: 'Blender',
    appName: 'Blender',
    category: 'creative',
    tagline: 'Rendering · Frame 148/240 · Cycles',
    description: 'シーン、フレーム、レンダラー、経過時間を表示する3D作業スタイル。',
    accent: '#ea7600',
    secondary: '#265787',
    activityType: 'playing',
    details: 'Rendering — Neon District',
    state: 'Scene: City · Frame 148/240',
    largeKey: 'blender',
    largeText: 'Blender 4.3',
    smallKey: 'cycles',
    smallText: 'Cycles Renderer',
    buttons: p([
      ['Blender', 'https://www.blender.org'],
      ['Download', 'https://www.blender.org/download/']
    ]),
    statusDisplay: 2,
    offsetMinutes: 18,
    assetKeys: [
      { key: 'blender', label: 'Large — Blender' },
      { key: 'cycles', label: 'Small — renderer' }
    ]
  },
  {
    id: 'obs',
    name: 'OBS Studio',
    appName: 'OBS Studio',
    category: 'creative',
    tagline: 'Streaming · Twitch · 1080p60',
    description: '配信先、シーン、解像度、配信時間を表示するライブ配信スタイル。',
    accent: '#302e31',
    secondary: '#8b7cff',
    activityType: 'playing',
    details: 'Streaming to Twitch',
    state: 'Scene: Gameplay · 1080p60',
    largeKey: 'obs',
    largeText: 'OBS Studio',
    smallKey: 'live',
    smallText: 'LIVE',
    buttons: p([
      ['Watch stream', 'https://www.twitch.tv'],
      ['OBS Studio', 'https://obsproject.com']
    ]),
    statusDisplay: 1,
    offsetMinutes: 84,
    assetKeys: [
      { key: 'obs', label: 'Large — OBS' },
      { key: 'live', label: 'Small — live badge' }
    ]
  },
  {
    id: 'unity',
    name: 'Unity Editor',
    appName: 'Unity',
    category: 'dev',
    tagline: 'Scene: Rooftop · Play Mode',
    description: 'シーン、プラットフォーム、Play Mode、作業時間を表示するゲーム開発スタイル。',
    accent: '#222c37',
    secondary: '#ffffff',
    activityType: 'playing',
    details: 'Editing — Neon District',
    state: 'Scene: Rooftop · Play Mode',
    largeKey: 'unity',
    largeText: 'Unity 6',
    smallKey: 'unity_play',
    smallText: 'Play Mode',
    buttons: p([
      ['Unity', 'https://unity.com'],
      ['Documentation', 'https://docs.unity3d.com']
    ]),
    statusDisplay: 2,
    offsetMinutes: 39,
    assetKeys: [
      { key: 'unity', label: 'Large — Unity' },
      { key: 'unity_play', label: 'Small — play mode' }
    ]
  },
  {
    id: 'spotify',
    name: 'Spotify',
    appName: 'Spotify',
    category: 'music',
    tagline: 'Midnight City · M83 · 1:42',
    description: '曲名、アーティスト、アルバム、再生時間を表示するListening構成。',
    accent: '#1db954',
    secondary: '#191414',
    activityType: 'listening',
    details: 'Midnight City',
    state: 'M83',
    largeKey: 'spotify',
    largeText: 'Hurry Up, We’re Dreaming',
    smallKey: 'spotify',
    smallText: 'Spotify',
    buttons: p([['Listen on Spotify', 'https://open.spotify.com']]),
    statusDisplay: 1,
    offsetMinutes: 1.7,
    assetKeys: [
      { key: 'spotify', label: 'Large — album art' },
      { key: 'spotify', label: 'Small — Spotify' }
    ]
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    appName: 'Apple Music',
    category: 'music',
    tagline: 'Nightcall · Kavinsky · 4:18',
    description: 'Apple Musicの再生中らしい曲・アーティスト・アルバム表示。',
    accent: '#fa243c',
    secondary: '#ff6b81',
    activityType: 'listening',
    details: 'Nightcall',
    state: 'Kavinsky',
    largeKey: 'apple_music',
    largeText: 'OutRun',
    smallKey: 'apple_music',
    smallText: 'Apple Music',
    buttons: p([['Listen on Apple Music', 'https://music.apple.com']]),
    statusDisplay: 1,
    offsetMinutes: 4.3,
    assetKeys: [
      { key: 'apple_music', label: 'Large — album art' },
      { key: 'apple_music', label: 'Small — Apple Music' }
    ]
  },
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    appName: 'YouTube Music',
    category: 'music',
    tagline: 'Resonance · HOME · 3:31',
    description: 'YouTube Musicの再生中らしい曲・アーティスト・アルバム表示。',
    accent: '#ff0000',
    secondary: '#ff7a7a',
    activityType: 'listening',
    details: 'Resonance',
    state: 'HOME',
    largeKey: 'youtube_music',
    largeText: 'Odyssey',
    smallKey: 'youtube_music',
    smallText: 'YouTube Music',
    buttons: p([['Listen on YouTube Music', 'https://music.youtube.com']]),
    statusDisplay: 1,
    offsetMinutes: 3.5,
    assetKeys: [
      { key: 'youtube_music', label: 'Large — album art' },
      { key: 'youtube_music', label: 'Small — YouTube Music' }
    ]
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    appName: 'SoundCloud',
    category: 'music',
    tagline: 'Sunset Lover · Petit Biscuit · 3:58',
    description: 'SoundCloudの再生中らしい曲・アーティスト・アルバム表示。',
    accent: '#ff5500',
    secondary: '#ff9a5c',
    activityType: 'listening',
    details: 'Sunset Lover',
    state: 'Petit Biscuit',
    largeKey: 'soundcloud',
    largeText: 'Presence',
    smallKey: 'soundcloud',
    smallText: 'SoundCloud',
    buttons: p([['Listen on SoundCloud', 'https://soundcloud.com']]),
    statusDisplay: 1,
    offsetMinutes: 3.9,
    assetKeys: [
      { key: 'soundcloud', label: 'Large — artwork' },
      { key: 'soundcloud', label: 'Small — SoundCloud' }
    ]
  },
  {
    id: 'photoshop',
    name: 'Photoshop',
    appName: 'Adobe Photoshop',
    category: 'creative',
    tagline: 'Editing keyart.psd · 4K · Brush',
    description: 'ドキュメント名、キャンバスサイズ、選択ツールを表示する制作中スタイル。',
    accent: '#31a8ff',
    secondary: '#001e36',
    activityType: 'playing',
    details: 'Editing — keyart.psd',
    state: 'Tool: Brush · 4096 × 2160',
    largeKey: 'photoshop',
    largeText: 'Adobe Photoshop',
    smallKey: 'ps_brush',
    smallText: 'Brush Tool',
    buttons: p([
      ['Photoshop', 'https://www.adobe.com/products/photoshop.html'],
      ['Behance', 'https://www.behance.net']
    ]),
    statusDisplay: 2,
    offsetMinutes: 33,
    assetKeys: [
      { key: 'photoshop', label: 'Large — Photoshop' },
      { key: 'ps_brush', label: 'Small — tool' }
    ]
  },
  {
    id: 'davinci',
    name: 'DaVinci Resolve',
    appName: 'DaVinci Resolve',
    category: 'creative',
    tagline: 'Editing · Timeline 01 · 4K 24fps',
    description: 'タイムライン、解像度、フレームレート、作業時間を表示する編集スタイル。',
    accent: '#f5a623',
    secondary: '#ff5a5f',
    activityType: 'playing',
    details: 'Editing — Neon District',
    state: 'Timeline 01 · 4K 24fps',
    largeKey: 'davinci_resolve',
    largeText: 'DaVinci Resolve',
    smallKey: 'resolve_timeline',
    smallText: 'Edit Page',
    buttons: p([
      ['DaVinci Resolve', 'https://www.blackmagicdesign.com/products/davinciresolve'],
      ['Blackmagic', 'https://www.blackmagicdesign.com']
    ]),
    statusDisplay: 2,
    offsetMinutes: 57,
    assetKeys: [
      { key: 'davinci_resolve', label: 'Large — Resolve' },
      { key: 'resolve_timeline', label: 'Small — timeline' }
    ]
  },
  {
    id: 'ableton',
    name: 'Ableton Live',
    appName: 'Ableton Live',
    category: 'music',
    tagline: 'Producing · Night Drive · 124 BPM',
    description: 'プロジェクト、BPM、使用中のビューを表示するDTM制作スタイル。',
    accent: '#ff764d',
    secondary: '#b6ff5c',
    activityType: 'playing',
    details: 'Producing — Night Drive',
    state: 'Project: Night Drive · 124 BPM',
    largeKey: 'ableton',
    largeText: 'Ableton Live 12',
    smallKey: 'ableton_session',
    smallText: 'Session View',
    buttons: p([
      ['Ableton Live', 'https://www.ableton.com'],
      ['Live manual', 'https://www.ableton.com/en/live/']
    ]),
    statusDisplay: 2,
    offsetMinutes: 71,
    assetKeys: [
      { key: 'ableton', label: 'Large — Ableton' },
      { key: 'ableton_session', label: 'Small — session' }
    ]
  }
]

export function presetArt(preset: SimulationPreset): string {
  return makeArtwork(`preset-${preset.id}`, preset.accent, preset.secondary)
}

export function presetAppIcon(preset: SimulationPreset): string {
  return makeAvatar(preset.appName, preset.accent, preset.secondary)
}

export function presetToPresence(preset: SimulationPreset, enabled = false): PresenceConfig {
  const now = Date.now()
  const start = new Date(now - preset.offsetMinutes * 60_000).toISOString()
  const end = new Date(now + 60 * 60_000).toISOString()

  const blockKinds: PresenceBlockKind[] = ['largeImage']
  if (preset.smallKey) blockKinds.push('smallImage')
  blockKinds.push('details', 'state', 'timestamp')
  if (preset.party) blockKinds.push('party')
  if (preset.buttons && preset.buttons.length > 0) blockKinds.push('buttons')
  blockKinds.push('statusDisplay')

  return {
    ...createDefaultPresence(),
    enabled,
    activityType: preset.activityType,
    details: preset.details.slice(0, 128),
    state: preset.state.slice(0, 128),
    largeImage: preset.largeKey,
    largeImageText: preset.largeText.slice(0, 128),
    largeImageMode: 'asset',
    smallImage: preset.smallKey ?? '',
    smallImageText: (preset.smallText ?? '').slice(0, 128),
    smallImageMode: 'asset',
    timestampMode: 'elapsed',
    startISO: start,
    endISO: end,
    partyEnabled: Boolean(preset.party),
    partyCurrent: String(preset.party?.current ?? 1),
    partyMax: String(preset.party?.max ?? 1),
    partyId: '',
    buttons: (preset.buttons ?? []).map((button) => ({
      id: uid(),
      label: button.label.slice(0, 32),
      url: button.url
    })),
    statusDisplay: preset.statusDisplay ?? 0,
    blocks: blockKinds.map((kind) => makePresenceBlock(kind))
  }
}
