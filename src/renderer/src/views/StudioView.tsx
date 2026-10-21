import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlignLeft,
  Blocks,
  ChevronDown,
  CircleDot,
  Clock3,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  MonitorSmartphone,
  MousePointerClick,
  Music2,
  Pause,
  Play,
  Plus,
  PlugZap,
  Radio,
  Sparkles,
  Timer,
  Trash2,
  Type,
  Users,
  Zap,
  Check
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  PresenceBlock,
  PresenceBlockKind,
  PresenceConfig,
  TimestampMode
} from '../../../shared/types'
import { PageHeader, Segmented, Switch, EmptyState, Field, Avatar } from '../components/ui'
import { ActivityPreview } from '../components/ActivityPreview'
import { ProfilePreview } from '../components/ProfilePreview'
import { useAppStore, useActivePersona } from '../store/appStore'
import { useUiStore, toast } from '../store/uiStore'
import { PRESENCE_BLOCK_DEFS, PRESENCE_BLOCK_MAP } from '../lib/seed'
import { buildActivity, ACTIVITY_LABELS } from '../lib/presence'
import { goLive, stopLive } from '../lib/live'
import { formatCountdown, formatElapsed, fromLocalInput, toLocalInput } from '../lib/format'
import { cn } from '../lib/cn'
import { useNow } from '../lib/hooks'

const BLOCK_ICONS: Record<PresenceBlockKind, LucideIcon> = {
  details: AlignLeft,
  state: Type,
  largeImage: ImageIcon,
  smallImage: CircleDot,
  timestamp: Timer,
  party: Users,
  buttons: MousePointerClick,
  statusDisplay: MonitorSmartphone
}

const ACTIVITY_OPTIONS = (['playing', 'listening', 'watching', 'competing'] as const).map((value) => ({
  value,
  label: ACTIVITY_LABELS[value].label
}))

function PaletteItem({
  kind,
  added,
  onAdd
}: {
  kind: PresenceBlockKind
  added: boolean
  onAdd: () => void
}): React.JSX.Element {
  const definition = PRESENCE_BLOCK_MAP[kind]
  const Icon = BLOCK_ICONS[kind]
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${kind}`,
    data: { type: 'palette', kind },
    disabled: added
  })

  return (
    <div
      ref={setNodeRef}
      className={cn('palette-item', added && 'added', isDragging && 'dragging')}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onAdd()
        }
      }}
    >
      <span className="palette-item-icon">
        <Icon size={14} />
      </span>
      <span className="grow">
        <span className="palette-item-label">{definition.label}</span>
        <span className="palette-item-desc">{definition.english}</span>
      </span>
      {added ? <span className="palette-item-added">ADDED</span> : <Plus size={12} className="palette-plus" />}
    </div>
  )
}

function blockSummary(kind: PresenceBlockKind, presence: PresenceConfig, now: number): string {
  switch (kind) {
    case 'details':
      return presence.details || '未入力'
    case 'state':
      return presence.state || '未入力'
    case 'largeImage':
      return presence.largeImage || 'アートワーク未設定'
    case 'smallImage':
      return presence.smallImage || 'バッジ未設定'
    case 'timestamp':
      return presence.timestampMode === 'none'
        ? 'オフ'
        : presence.timestampMode === 'elapsed'
          ? `経過 ${formatElapsed(presence.startISO, now)}`
          : `残り ${formatCountdown(presence.endISO, now)}`
    case 'party':
      return presence.partyEnabled ? `${presence.partyCurrent || 0} / ${presence.partyMax || 0} 人` : 'オフ'
    case 'buttons':
      return `${presence.buttons.filter((button) => button.label || button.url).length} 個のリンク`
    case 'statusDisplay':
      return ['アプリ名', '詳細', 'ステータス'][presence.statusDisplay] ?? 'アプリ名'
    default:
      return ''
  }
}

function BlockEditor({ block }: { block: PresenceBlock }): React.JSX.Element {
  const presence = useAppStore((state) => state.presence)
  const updatePresence = useAppStore((state) => state.updatePresence)
  const assets = useAppStore((state) => state.assets)
  const now = useNow(1000)
  const [imageMode, setImageMode] = useState<'asset' | 'url'>(
    block.kind === 'smallImage' ? presence.smallImageMode : presence.largeImageMode
  )

  const imageKey = block.kind === 'largeImage' ? 'largeImage' : 'smallImage'
  const imageTextKey = block.kind === 'largeImage' ? 'largeImageText' : 'smallImageText'
  const imageValue = presence[imageKey]
  const assetKeys = assets.filter((asset) => asset.kind === 'key')

  switch (block.kind) {
    case 'details':
      return (
        <div className="block-editor">
          <Field
            label="詳細 / Details"
            hint={`${presence.details.length}/128`}
            help="アクティビティの1行目。ゲーム名、章、作業内容など。"
            htmlFor={`details-${block.id}`}
          >
            <input
              id={`details-${block.id}`}
              className="input"
              value={presence.details}
              maxLength={128}
              placeholder="Neon District — Chapter 04"
              onChange={(event) => updatePresence({ details: event.target.value })}
            />
          </Field>
        </div>
      )
    case 'state':
      return (
        <div className="block-editor">
          <Field
            label="ステータス / State"
            hint={`${presence.state.length}/128`}
            help="アクティビティの2行目。進捗、気分、再生中の曲など。"
            htmlFor={`state-${block.id}`}
          >
            <input
              id={`state-${block.id}`}
              className="input"
              value={presence.state}
              maxLength={128}
              placeholder="Rain on the windshield · 88.1 FM"
              onChange={(event) => updatePresence({ state: event.target.value })}
            />
          </Field>
        </div>
      )
    case 'largeImage':
    case 'smallImage':
      return (
        <div className="block-editor stack" style={{ gap: 12 }}>
          <div className="row-between">
            <span className="field-label">画像ソース</span>
            <Segmented
              tiny
              value={imageMode}
              options={[
                { value: 'asset', label: 'Asset Key' },
                { value: 'url', label: 'URL' }
              ]}
              onChange={(value) => {
                setImageMode(value)
                updatePresence(block.kind === 'largeImage' ? { largeImageMode: value } : { smallImageMode: value })
              }}
            />
          </div>
          <Field
            label={block.kind === 'largeImage' ? 'ラージ画像' : 'スモール画像'}
            hint={imageMode === 'asset' ? 'Portal > Rich Presence > Art Assets' : 'https://…'}
            help={
              imageMode === 'asset'
                ? 'Developer Portal の Art Assets にアップロードしたキー名を指定します。'
                : '外部URLはDiscord側のプロキシ設定が必要な場合があります。'
            }
            htmlFor={`image-${block.id}`}
          >
            <input
              id={`image-${block.id}`}
              className="input mono"
              value={imageValue}
              placeholder={imageMode === 'asset' ? 'night_drive_cover' : 'https://…'}
              onChange={(event) => updatePresence({ [imageKey]: event.target.value })}
            />
          </Field>
          {imageValue && !imageValue.startsWith('data:') && (
            <div className="asset-preview">
              <img
                src={imageValue}
                alt=""
                onError={(event) => {
                  ;(event.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <span className="mono truncate">{imageValue}</span>
            </div>
          )}
          {assetKeys.length > 0 && (
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {assetKeys.slice(0, 5).map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="chip"
                  onClick={() => updatePresence({ [imageKey]: asset.value })}
                >
                  {asset.name}
                </button>
              ))}
            </div>
          )}
          <Field
            label="画像キャプション"
            hint={`${String(presence[imageTextKey]).length}/128`}
            htmlFor={`image-text-${block.id}`}
          >
            <input
              id={`image-text-${block.id}`}
              className="input"
              value={presence[imageTextKey]}
              maxLength={128}
              placeholder={block.kind === 'largeImage' ? 'Night Drive OST' : 'Lossless'}
              onChange={(event) => updatePresence({ [imageTextKey]: event.target.value })}
            />
          </Field>
        </div>
      )
    case 'timestamp':
      return (
        <div className="block-editor stack" style={{ gap: 12 }}>
          <Field label="表示モード" hint="Discord のタイマー">
            <Segmented
              full
              value={presence.timestampMode}
              options={[
                { value: 'none', label: 'なし' },
                { value: 'elapsed', label: '経過時間' },
                { value: 'countdown', label: 'カウントダウン' }
              ]}
              onChange={(value) => updatePresence({ timestampMode: value as TimestampMode })}
            />
          </Field>
          {presence.timestampMode === 'elapsed' && (
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <Field label="開始日時" hint={formatElapsed(presence.startISO, now)} htmlFor="ts-start">
                <input
                  id="ts-start"
                  className="input"
                  type="datetime-local"
                  value={toLocalInput(presence.startISO)}
                  onChange={(event) => updatePresence({ startISO: fromLocalInput(event.target.value) })}
                />
              </Field>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => updatePresence({ startISO: new Date().toISOString() })}
              >
                今
              </button>
            </div>
          )}
          {presence.timestampMode === 'countdown' && (
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <Field label="終了日時" hint={formatCountdown(presence.endISO, now)} htmlFor="ts-end">
                <input
                  id="ts-end"
                  className="input"
                  type="datetime-local"
                  value={toLocalInput(presence.endISO)}
                  onChange={(event) => updatePresence({ endISO: fromLocalInput(event.target.value) })}
                />
              </Field>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  updatePresence({ endISO: new Date(Date.now() + 60 * 60 * 1000).toISOString() })
                }
              >
                +1h
              </button>
            </div>
          )}
          <div className="activity-chip" style={{ alignSelf: 'flex-start' }}>
            <Clock3 size={12} />
            {presence.timestampMode === 'none'
              ? 'タイマーは表示されません'
              : presence.timestampMode === 'elapsed'
                ? `経過 ${formatElapsed(presence.startISO, now)}`
                : `残り ${formatCountdown(presence.endISO, now)}`}
          </div>
        </div>
      )
    case 'party':
      return (
        <div className="block-editor stack" style={{ gap: 12 }}>
          <div className="toggle-row" style={{ paddingTop: 0 }}>
            <div className="toggle-row-copy">
              <div className="toggle-row-title">パーティ人数を表示</div>
              <div className="toggle-row-desc">フレンドに「2 / 4」のような枠を表示します。</div>
            </div>
            <Switch checked={presence.partyEnabled} onChange={(value) => updatePresence({ partyEnabled: value })} />
          </div>
          <div className="form-grid three">
            <Field label="現在" htmlFor="party-current">
              <input
                id="party-current"
                className="input mono"
                type="number"
                min={0}
                value={presence.partyCurrent}
                onChange={(event) => updatePresence({ partyCurrent: event.target.value })}
              />
            </Field>
            <Field label="最大" htmlFor="party-max">
              <input
                id="party-max"
                className="input mono"
                type="number"
                min={1}
                value={presence.partyMax}
                onChange={(event) => updatePresence({ partyMax: event.target.value })}
              />
            </Field>
            <Field label="Party ID" hint="任意" htmlFor="party-id">
              <input
                id="party-id"
                className="input mono"
                value={presence.partyId}
                placeholder="自動"
                onChange={(event) => updatePresence({ partyId: event.target.value })}
              />
            </Field>
          </div>
        </div>
      )
    case 'buttons':
      return (
        <div className="block-editor stack" style={{ gap: 10 }}>
          {presence.buttons.map((button, index) => (
            <div className="button-editor-row" key={button.id}>
              <span className="button-index">{index + 1}</span>
              <div className="stack" style={{ gap: 6 }}>
                <input
                  className="input"
                  value={button.label}
                  maxLength={32}
                  placeholder="Listen along"
                  onChange={(event) =>
                    updatePresence({
                      buttons: presence.buttons.map((item) =>
                        item.id === button.id ? { ...item, label: event.target.value } : item
                      )
                    })
                  }
                />
                <input
                  className="input mono"
                  value={button.url}
                  placeholder="https://…"
                  onChange={(event) =>
                    updatePresence({
                      buttons: presence.buttons.map((item) =>
                        item.id === button.id ? { ...item, url: event.target.value } : item
                      )
                    })
                  }
                />
              </div>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() =>
                  updatePresence({ buttons: presence.buttons.filter((item) => item.id !== button.id) })
                }
                aria-label="削除"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {presence.buttons.length < 2 && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={() =>
                updatePresence({
                  buttons: [
                    ...presence.buttons,
                    { id: crypto.randomUUID(), label: '', url: 'https://' }
                  ]
                })
              }
            >
              <Plus size={12} /> ボタンを追加（最大2個）
            </button>
          )}
        </div>
      )
    case 'statusDisplay':
      return (
        <div className="block-editor stack" style={{ gap: 10 }}>
          <Field
            label="ステータスに表示するもの"
            help="Discord のメンバーリストで、アクティビティのどの情報を出すか。新しいRPCクライアント向けの設定です。"
          >
            <Segmented
              full
              value={presence.statusDisplay}
              options={[
                { value: 0, label: 'アプリ名' },
                { value: 1, label: '詳細' },
                { value: 2, label: 'ステータス' }
              ]}
              onChange={(value) => updatePresence({ statusDisplay: value as 0 | 1 | 2 })}
            />
          </Field>
        </div>
      )
    default:
      return <div />
  }
}

function SortableBlock({ block }: { block: PresenceBlock }): React.JSX.Element {
  const presence = useAppStore((state) => state.presence)
  const togglePresenceBlock = useAppStore((state) => state.togglePresenceBlock)
  const removePresenceBlock = useAppStore((state) => state.removePresenceBlock)
  const selectedId = useUiStore((state) => state.selectedPresenceBlockId)
  const setSelected = useUiStore((state) => state.setSelectedPresenceBlock)
  const now = useNow(1000)
  const selected = selectedId === block.id
  const definition = PRESENCE_BLOCK_MAP[block.kind]
  const Icon = BLOCK_ICONS[block.kind]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: 'block' }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('block-card', selected && 'selected', !block.enabled && 'off', isDragging && 'is-dragging')}
      onClick={(event) => {
        event.stopPropagation()
        setSelected(selected ? null : block.id)
      }}
    >
      <div className="block-card-head">
        <button
          type="button"
          className="drag-handle"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="ドラッグして並べ替え"
        >
          <GripVertical size={14} />
        </button>
        <span className="block-icon">
          <Icon size={14} />
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="block-title-line">
            <span className="block-title">{definition.label}</span>
            <span className="block-english">{definition.english}</span>
            {!block.enabled && <span className="pill mono">OFF</span>}
          </div>
          <div className="block-summary truncate">{blockSummary(block.kind, presence, now)}</div>
        </div>
        <button
          type="button"
          className="icon-btn sm"
          onClick={(event) => {
            event.stopPropagation()
            togglePresenceBlock(block.id)
          }}
          aria-label={block.enabled ? '無効化' : '有効化'}
          data-tip={block.enabled ? '無効化' : '有効化'}
        >
          {block.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          type="button"
          className="icon-btn sm danger"
          onClick={(event) => {
            event.stopPropagation()
            removePresenceBlock(block.id)
            if (selected) setSelected(null)
          }}
          aria-label="削除"
          data-tip="削除"
        >
          <Trash2 size={13} />
        </button>
        <ChevronDown size={14} className={cn('block-chevron', selected && 'open')} />
      </div>
      {selected && (
        <div onClick={(event) => event.stopPropagation()}>
          <BlockEditor block={block} />
        </div>
      )}
    </div>
  )
}

function Palette(): React.JSX.Element {
  const presence = useAppStore((state) => state.presence)
  const addPresenceBlock = useAppStore((state) => state.addPresenceBlock)
  const setSelected = useUiStore((state) => state.setSelectedPresenceBlock)
  const categories = ['Text', 'Media', 'Meta', 'Actions'] as const

  const add = (kind: PresenceBlockKind): void => {
    addPresenceBlock(kind)
    const state = useAppStore.getState()
    const block = state.presence.blocks.find((item) => item.kind === kind)
    if (block) setSelected(block.id)
  }

  return (
    <aside className="palette panel">
      <div className="palette-head">
        <div>
          <div className="palette-title">Blocks</div>
          <div className="palette-sub">ドラッグして追加</div>
        </div>
        <Sparkles size={15} className="text-accent" />
      </div>
      <div className="palette-scroll">
        {categories.map((category) => (
          <div className="palette-group" key={category}>
            <div className="palette-group-label">{category}</div>
            {PRESENCE_BLOCK_DEFS.filter((definition) => definition.category === category).map((definition) => (
              <PaletteItem
                key={definition.kind}
                kind={definition.kind}
                added={presence.blocks.some((block) => block.kind === definition.kind)}
                onAdd={() => add(definition.kind)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="palette-foot">
        <span className="dot" />
        <span>ブロックは自由に並べ替えできます</span>
      </div>
    </aside>
  )
}

function ComposerEndZone(): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: 'composer-end' })
  return (
    <div ref={setNodeRef} className={cn('composer-end', isOver && 'over')}>
      <Plus size={13} />
      ここにドロップして末尾に追加
    </div>
  )
}

export function StudioView(): React.JSX.Element {
  const presence = useAppStore((state) => state.presence)
  const updatePresence = useAppStore((state) => state.updatePresence)
  const movePresenceBlocks = useAppStore((state) => state.movePresenceBlocks)
  const addPresenceBlock = useAppStore((state) => state.addPresenceBlock)
  const settings = useAppStore((state) => state.settings)
  const personas = useAppStore((state) => state.personas)
  const setActivePersona = useAppStore((state) => state.setActivePersona)
  const addPersona = useAppStore((state) => state.addPersona)
  const persona = useActivePersona()
  const previewTab = useUiStore((state) => state.previewTab)
  const setPreviewTab = useUiStore((state) => state.setPreviewTab)
  const goLiveBusy = useUiStore((state) => state.goLiveBusy)
  const setView = useUiStore((state) => state.setView)
  const setSelected = useUiStore((state) => state.setSelectedPresenceBlock)
  const setQuickConnectOpen = useUiStore((state) => state.setQuickConnectOpen)
  const setPersonaEditor = useUiStore((state) => state.setPersonaEditor)
  const [activeKind, setActiveKind] = useState<PresenceBlockKind | null>(null)
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const build = useMemo(() => buildActivity(presence, persona), [presence, persona])
  const blockIds = presence.blocks.map((block) => block.id)

  const onDragStart = (event: DragStartEvent): void => {
    const data = event.active.data.current
    if (data?.type === 'palette') setActiveKind(data.kind as PresenceBlockKind)
    else setActiveKind(null)
  }

  const onDragEnd = (event: DragEndEvent): void => {
    setActiveKind(null)
    const { active, over } = event
    const data = active.data.current
    if (!over) return

    if (data?.type === 'palette') {
      const kind = data.kind as PresenceBlockKind
      const overId = String(over.id)
      const index =
        overId === 'composer-end' ? presence.blocks.length : presence.blocks.findIndex((block) => block.id === overId)
      addPresenceBlock(kind, index >= 0 ? index : presence.blocks.length)
      const state = useAppStore.getState()
      const created = state.presence.blocks.find((block) => block.kind === kind)
      if (created) {
        setSelected(created.id)
        toast('success', `${PRESENCE_BLOCK_MAP[kind].label} を追加しました`)
      }
      return
    }

    if (active.id !== over.id) {
      movePresenceBlocks(String(active.id), String(over.id))
    }
  }

  const toggleLiveAction = async (): Promise<void> => {
    if (presence.enabled) await stopLive()
    else await goLive()
  }

  return (
    <div className="view">
      <div className="view-inner">
        <PageHeader
          eyebrow="PRESENCE / COMPOSER"
          title={
            <>
              Craft your <span className="title-accent">signal</span>
            </>
          }
          subtitle="ブロックを並べて、Discord に表示するアクティビティを組み立てます。"
          actions={
            <>
              <div className="persona-menu-wrap">
                <button
                  type="button"
                  className="persona-chip"
                  onClick={() => setPersonaMenuOpen((open) => !open)}
                  aria-expanded={personaMenuOpen}
                >
                  <Avatar src={persona.avatar} name={persona.name} size={22} />
                  <span>{persona.name}</span>
                  <ChevronDown size={12} className={cn(personaMenuOpen && 'flip')} />
                </button>
                {personaMenuOpen && (
                  <>
                    <div className="persona-menu-backdrop" onClick={() => setPersonaMenuOpen(false)} />
                    <div className="persona-menu">
                      <div className="persona-menu-label">PERSONAS</div>
                      {personas.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={cn('persona-menu-item', item.id === persona.id && 'active')}
                          onClick={() => {
                            setActivePersona(item.id)
                            setPersonaMenuOpen(false)
                          }}
                        >
                          <Avatar src={item.avatar} name={item.name} size={24} />
                          <span className="grow">
                            <span className="persona-menu-name">{item.name}</span>
                            <span className="persona-menu-handle">@{item.handle}</span>
                          </span>
                          {item.id === persona.id && <Check size={13} className="text-ok" />}
                        </button>
                      ))}
                      <div className="persona-menu-divider" />
                      <button
                        type="button"
                        className="persona-menu-action"
                        onClick={() => {
                          setPersonaMenuOpen(false)
                          setView('profiles')
                        }}
                      >
                        <Users size={13} /> ペルソナを管理
                      </button>
                      <button
                        type="button"
                        className="persona-menu-action"
                        onClick={() => {
                          const id = addPersona()
                          setPersonaMenuOpen(false)
                          setPersonaEditor(id)
                        }}
                      >
                        <Plus size={13} /> 新しいペルソナ
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                className={cn('btn', presence.enabled ? 'btn-live' : 'btn-primary')}
                onClick={toggleLiveAction}
                disabled={goLiveBusy}
              >
                {goLiveBusy ? (
                  <Zap size={14} className="spin" />
                ) : presence.enabled ? (
                  <Pause size={14} />
                ) : (
                  <Play size={14} />
                )}
                {presence.enabled ? 'Stop presence' : 'Go live'}
              </button>
            </>
          }
        />

        {!settings.appId && (
          <div className="setup-banner panel">
            <span className="setup-icon">
              <PlugZap size={16} />
            </span>
            <div className="grow">
              <div className="setup-title">Discord Application を接続して始める</div>
              <div className="setup-text">
                Developer Portal でアプリを作成し、Application ID を設定すると Presence を実際に表示できます。
              </div>
            </div>
            <button type="button" className="btn btn-sm" onClick={() => setQuickConnectOpen(true)}>
              Application ID を設定
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() =>
                void window.presenceStudio.widget.openExternal('https://discord.com/developers/applications')
              }
            >
              Developer Portal
            </button>
          </div>
        )}

        <div className="studio-grid">
          <Palette />
          <section className="composer" onClick={() => setSelected(null)}>
            <div className="composer-toolbar panel" onClick={(event) => event.stopPropagation()}>
              <div className="row" style={{ minWidth: 0 }}>
                <span className="composer-app-icon">
                  <Music2 size={15} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="composer-app-name truncate">{settings.previewAppName || 'Your application'}</div>
                  <div className="composer-app-sub">
                    {settings.appId ? `Application ${settings.appId}` : 'Application ID 未設定'}
                  </div>
                </div>
              </div>
              <div className="composer-toolbar-right">
                <Segmented
                  tiny
                  value={presence.activityType}
                  options={ACTIVITY_OPTIONS}
                  onChange={(value) => updatePresence({ activityType: value })}
                />
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                <div className="block-stack">
                  {presence.blocks.length === 0 && (
                    <EmptyState
                      icon={<Blocks size={19} />}
                      title="ブロックがありません"
                      text="左のパレットから詳細や画像をドラッグして、アクティビティを組み立ててください。"
                    />
                  )}
                  {presence.blocks.map((block) => (
                    <SortableBlock key={block.id} block={block} />
                  ))}
                  <ComposerEndZone />
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeKind && (
                  <div className="drag-overlay-card">
                    <span className="block-icon">
                      {(() => {
                        const Icon = BLOCK_ICONS[activeKind]
                        return <Icon size={14} />
                      })()}
                    </span>
                    <span>{PRESENCE_BLOCK_MAP[activeKind].label}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>

            <div className="composer-status">
              <div className="row" style={{ minWidth: 0 }}>
                <span
                  className={cn(
                    'dot',
                    build.errors.length > 0 ? 'error' : !settings.appId ? 'connecting' : 'live'
                  )}
                />
                <span className="composer-status-text">
                  {build.errors.length > 0
                    ? build.errors[0]
                    : !settings.appId
                      ? 'Application ID を設定すると Discord に反映できます'
                      : build.warnings.length > 0
                        ? build.warnings[0]
                        : '準備完了 — Go live で Discord に反映できます'}
                </span>
              </div>
              <span className="mono fs-11">{presence.blocks.filter((block) => block.enabled).length} active blocks</span>
            </div>
          </section>

          <aside className="preview-pane">
            <div className="preview-tabs">
              <button
                type="button"
                className={cn('preview-tab', previewTab === 'activity' && 'active')}
                onClick={() => setPreviewTab('activity')}
              >
                <Radio size={12} /> Activity
              </button>
              <button
                type="button"
                className={cn('preview-tab', previewTab === 'profile' && 'active')}
                onClick={() => setPreviewTab('profile')}
              >
                <Users size={12} /> Profile
              </button>
            </div>
            {previewTab === 'activity' ? (
              <ActivityPreview
                persona={persona}
                presence={presence}
                settings={settings}
                live={presence.enabled}
              />
            ) : (
              <ProfilePreview persona={persona} presence={presence} settings={settings} />
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
