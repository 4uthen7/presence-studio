import { create } from 'zustand'
import type {
  AppState,
  Asset,
  BadgeId,
  Persona,
  PresenceBlock,
  PresenceBlockKind,
  PresenceConfig,
  PublishLogEntry,
  Settings,
  WidgetBlock,
  WidgetBlockKind,
  WidgetConfig,
  WidgetZone
} from '../../../shared/types'
import {
  createDefaultPresence,
  createDefaultWidget,
  createSeedState,
  makePresenceBlock,
  makeWidgetBlock,
  uid,
  VALID_PRESENCE_KINDS,
  VALID_WIDGET_KINDS
} from '../lib/seed'

export interface AppStore extends AppState {
  hydrated: boolean
  hydrate: (state: AppState | null) => void
  replaceState: (state: AppState) => void
  setActivePersona: (id: string) => void
  addPersona: (persona?: Partial<Persona>) => string
  duplicatePersona: (id: string) => string | null
  removePersona: (id: string) => void
  updatePersona: (id: string, patch: Partial<Persona>) => void
  toggleBadge: (id: string, badge: BadgeId) => void
  updatePresence: (patch: Partial<PresenceConfig>) => void
  addPresenceBlock: (kind: PresenceBlockKind, index?: number) => void
  removePresenceBlock: (id: string) => void
  togglePresenceBlock: (id: string) => void
  movePresenceBlocks: (activeId: string, overId: string) => void
  insertPresenceBlock: (block: PresenceBlock, index: number) => void
  updateWidget: (patch: Partial<WidgetConfig>) => void
  updateWidgetBlock: (id: string, patch: Partial<WidgetBlock>) => void
  addWidgetBlock: (kind: WidgetBlockKind, zone: WidgetZone, index?: number) => void
  insertWidgetBlock: (block: WidgetBlock, zone: WidgetZone, index: number) => void
  removeWidgetBlock: (id: string) => void
  moveWidgetBlocks: (activeId: string, overId: string, targetZone: WidgetZone) => void
  updateSettings: (patch: Partial<Settings>) => void
  addAsset: (asset: Asset) => void
  removeAsset: (id: string) => void
  addPublishLog: (entry: PublishLogEntry) => void
  resetWorkspace: () => void
}

export function normalizeState(input: AppState | null): AppState {
  const seed = createSeedState()
  if (!input) return seed
  const personas = Array.isArray(input.personas) && input.personas.length > 0 ? input.personas : seed.personas
  const normalizedPersonas = personas.map((persona) => ({
    ...persona,
    id: persona.id || uid(),
    name: typeof persona.name === 'string' ? persona.name : 'Unnamed',
    handle: typeof persona.handle === 'string' ? persona.handle : 'user',
    pronouns: persona.pronouns ?? '',
    bio: persona.bio ?? '',
    avatar: persona.avatar ?? '',
    banner: persona.banner ?? '',
    accent: persona.accent || '#8b7cff',
    badges: Array.isArray(persona.badges) ? persona.badges : [],
    links: Array.isArray(persona.links)
      ? persona.links.map((link) => ({
          id: link.id || uid(),
          label: link.label ?? '',
          url: link.url ?? ''
        }))
      : [],
    userId: persona.userId ?? '',
    location: persona.location ?? '',
    timezone: persona.timezone ?? 'Asia/Tokyo',
    createdAt: persona.createdAt ?? new Date().toISOString()
  }))
  const activeId = normalizedPersonas.some((persona) => persona.id === input.activePersonaId)
    ? input.activePersonaId
    : normalizedPersonas[0].id
  const presenceBlocks = Array.isArray(input.presence?.blocks)
    ? input.presence.blocks.filter((block) => VALID_PRESENCE_KINDS.has(block.kind))
    : seed.presence.blocks
  const widgetBlocks = Array.isArray(input.widget?.blocks)
    ? input.widget.blocks.filter((block) => VALID_WIDGET_KINDS.has(block.kind))
    : seed.widget.blocks
  const activityTypes = ['playing', 'listening', 'watching', 'competing'] as const
  const activityType = activityTypes.includes(input.presence?.activityType as (typeof activityTypes)[number])
    ? (input.presence?.activityType as (typeof activityTypes)[number])
    : seed.presence.activityType
  const statusDisplay = [0, 1, 2].includes(Number(input.presence?.statusDisplay))
    ? (Number(input.presence?.statusDisplay) as 0 | 1 | 2)
    : 0
  const layout = input.widget?.layout === 'contained' ? 'contained' : 'hero'

  return {
    version: 1,
    personas: normalizedPersonas,
    activePersonaId: activeId,
    presence: {
      ...seed.presence,
      ...(input.presence ?? {}),
      activityType,
      statusDisplay,
      blocks: presenceBlocks,
      buttons: Array.isArray(input.presence?.buttons)
        ? input.presence.buttons.map((button) => ({
            id: button.id || uid(),
            label: button.label ?? '',
            url: button.url ?? ''
          }))
        : seed.presence.buttons
    },
    widget: {
      ...seed.widget,
      ...(input.widget ?? {}),
      layout,
      blocks: widgetBlocks,
      metadata: Array.isArray(input.widget?.metadata)
        ? input.widget.metadata.map((entry) => ({
            id: entry.id || uid(),
            key: entry.key ?? '',
            value: entry.value ?? ''
          }))
        : seed.widget.metadata,
      primary: { ...seed.widget.primary, ...(input.widget?.primary ?? {}) }
    },
    settings: { ...seed.settings, ...(input.settings ?? {}) },
    assets: Array.isArray(input.assets) ? input.assets : seed.assets,
    publishLog: Array.isArray(input.publishLog) ? input.publishLog : []
  }
}

export function toPersistedState(state: AppStore): AppState {
  return {
    version: 1,
    personas: state.personas,
    activePersonaId: state.activePersonaId,
    presence: state.presence,
    widget: state.widget,
    settings: state.settings,
    assets: state.assets,
    publishLog: state.publishLog
  }
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...createSeedState(),
  hydrated: false,

  hydrate: (state) => {
    set({ ...normalizeState(state), hydrated: true })
  },

  replaceState: (state) => {
    set({ ...normalizeState(state), hydrated: true })
  },

  setActivePersona: (id) => {
    if (!get().personas.some((persona) => persona.id === id)) return
    set({ activePersonaId: id })
  },

  addPersona: (patch = {}) => {
    const id = uid()
    const persona: Persona = {
      id,
      name: patch.name ?? 'New persona',
      handle: patch.handle ?? `user${Math.floor(Math.random() * 9000 + 1000)}`,
      pronouns: patch.pronouns ?? '',
      bio: patch.bio ?? '',
      avatar: patch.avatar ?? '',
      banner: patch.banner ?? '',
      accent: patch.accent ?? '#8b7cff',
      badges: patch.badges ?? [],
      links: patch.links ?? [],
      userId: patch.userId ?? '',
      location: patch.location ?? '',
      timezone: patch.timezone ?? 'Asia/Tokyo',
      createdAt: new Date().toISOString()
    }
    set((state) => ({ personas: [...state.personas, persona], activePersonaId: id }))
    return id
  },

  duplicatePersona: (id) => {
    const source = get().personas.find((persona) => persona.id === id)
    if (!source) return null
    const nextId = uid()
    const copy: Persona = {
      ...source,
      id: nextId,
      name: `${source.name} のコピー`,
      handle: `${source.handle}_2`,
      createdAt: new Date().toISOString(),
      links: source.links.map((link) => ({ ...link, id: uid() }))
    }
    set((state) => ({ personas: [...state.personas, copy], activePersonaId: nextId }))
    return nextId
  },

  removePersona: (id) => {
    const { personas, activePersonaId } = get()
    if (personas.length <= 1) return
    const next = personas.filter((persona) => persona.id !== id)
    set({
      personas: next,
      activePersonaId: activePersonaId === id ? next[0].id : activePersonaId
    })
  },

  updatePersona: (id, patch) => {
    set((state) => ({
      personas: state.personas.map((persona) =>
        persona.id === id ? { ...persona, ...patch, id: persona.id } : persona
      )
    }))
  },

  toggleBadge: (id, badge) => {
    set((state) => ({
      personas: state.personas.map((persona) => {
        if (persona.id !== id) return persona
        const has = persona.badges.includes(badge)
        return {
          ...persona,
          badges: has ? persona.badges.filter((item) => item !== badge) : [...persona.badges, badge]
        }
      })
    }))
  },

  updatePresence: (patch) => {
    set((state) => ({ presence: { ...state.presence, ...patch } }))
  },

  addPresenceBlock: (kind, index) => {
    const existing = get().presence.blocks.find((block) => block.kind === kind)
    if (existing) {
      set((state) => ({
        presence: {
          ...state.presence,
          blocks: state.presence.blocks.map((block) =>
            block.id === existing.id ? { ...block, enabled: true } : block
          )
        }
      }))
      return
    }
    const block = makePresenceBlock(kind)
    set((state) => {
      const blocks = [...state.presence.blocks]
      const at = index ?? blocks.length
      blocks.splice(Math.max(0, Math.min(at, blocks.length)), 0, block)
      return { presence: { ...state.presence, blocks } }
    })
  },

  removePresenceBlock: (id) => {
    set((state) => ({
      presence: { ...state.presence, blocks: state.presence.blocks.filter((block) => block.id !== id) }
    }))
  },

  togglePresenceBlock: (id) => {
    set((state) => ({
      presence: {
        ...state.presence,
        blocks: state.presence.blocks.map((block) =>
          block.id === id ? { ...block, enabled: !block.enabled } : block
        )
      }
    }))
  },

  movePresenceBlocks: (activeId, overId) => {
    set((state) => {
      const blocks = [...state.presence.blocks]
      const from = blocks.findIndex((block) => block.id === activeId)
      const to = blocks.findIndex((block) => block.id === overId)
      if (from < 0 || to < 0 || from === to) return {}
      const [moved] = blocks.splice(from, 1)
      blocks.splice(to, 0, moved)
      return { presence: { ...state.presence, blocks } }
    })
  },

  insertPresenceBlock: (block, index) => {
    set((state) => {
      const blocks = [...state.presence.blocks]
      blocks.splice(Math.max(0, Math.min(index, blocks.length)), 0, block)
      return { presence: { ...state.presence, blocks } }
    })
  },

  updateWidget: (patch) => {
    set((state) => ({ widget: { ...state.widget, ...patch } }))
  },

  updateWidgetBlock: (id, patch) => {
    set((state) => ({
      widget: {
        ...state.widget,
        blocks: state.widget.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block))
      }
    }))
  },

  addWidgetBlock: (kind, zone, index) => {
    const block = makeWidgetBlock(kind, zone)
    get().insertWidgetBlock(block, zone, index ?? get().widget.blocks.filter((item) => item.zone === zone).length)
  },

  insertWidgetBlock: (block, zone, index) => {
    set((state) => {
      const blocks = [...state.widget.blocks]
      const zoneIds = blocks.filter((item) => item.zone === zone)
      const anchor = zoneIds[index]
      const at = anchor ? blocks.findIndex((item) => item.id === anchor.id) : blocks.length
      blocks.splice(at < 0 ? blocks.length : at, 0, { ...block, zone })
      return { widget: { ...state.widget, blocks } }
    })
  },

  removeWidgetBlock: (id) => {
    set((state) => ({
      widget: { ...state.widget, blocks: state.widget.blocks.filter((block) => block.id !== id) }
    }))
  },

  moveWidgetBlocks: (activeId, overId, targetZone) => {
    set((state) => {
      const blocks = [...state.widget.blocks]
      const from = blocks.findIndex((block) => block.id === activeId)
      if (from < 0) return {}
      const [moved] = blocks.splice(from, 1)
      const updated = { ...moved, zone: targetZone }
      if (overId.startsWith('zone:')) {
        const zoneItems = blocks.filter((block) => block.zone === targetZone)
        if (zoneItems.length === 0) {
          blocks.push(updated)
        } else {
          const last = zoneItems[zoneItems.length - 1]
          blocks.splice(blocks.findIndex((block) => block.id === last.id) + 1, 0, updated)
        }
      } else {
        const to = blocks.findIndex((block) => block.id === overId)
        blocks.splice(to < 0 ? blocks.length : to, 0, updated)
      }
      return { widget: { ...state.widget, blocks } }
    })
  },

  updateSettings: (patch) => {
    set((state) => ({ settings: { ...state.settings, ...patch } }))
  },

  addAsset: (asset) => {
    set((state) => ({ assets: [asset, ...state.assets] }))
  },

  removeAsset: (id) => {
    set((state) => ({ assets: state.assets.filter((asset) => asset.id !== id) }))
  },

  addPublishLog: (entry) => {
    set((state) => ({ publishLog: [entry, ...state.publishLog].slice(0, 25) }))
  },

  resetWorkspace: () => {
    set({ ...createSeedState(), hydrated: true })
  }
}))

export function useActivePersona(): Persona {
  return useAppStore((state) => state.personas.find((persona) => persona.id === state.activePersonaId) ?? state.personas[0])
}

export function resetPresenceDraft(): PresenceConfig {
  return createDefaultPresence()
}

export function resetWidgetDraft(): WidgetConfig {
  return createDefaultWidget()
}
