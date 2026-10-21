import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlignLeft,
  BadgeCheck,
  BarChart3,
  ChevronDown,
  Gauge,
  GripVertical,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Link2,
  Minus,
  Palette,
  Plus,
  Send,
  Sparkles,
  Tag,
  Trash2,
  UserCircle
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { WidgetBlock, WidgetBlockKind, WidgetSpan, WidgetZone } from '../../../shared/types'
import { Field, PageHeader, Segmented } from '../components/ui'
import { WidgetPreview } from '../components/WidgetPreview'
import { useAppStore, useActivePersona } from '../store/appStore'
import { useUiStore } from '../store/uiStore'
import { WIDGET_BLOCK_DEFS, WIDGET_BLOCK_MAP, WIDGET_SPANS, makeWidgetBlock } from '../lib/seed'
import { buildWidgetPayload } from '../lib/widget'
import { isDiscordId } from '../lib/format'
import { cn } from '../lib/cn'
import { uid } from '../lib/seed'

const WIDGET_ICONS: Record<WidgetBlockKind, LucideIcon> = {
  eyebrow: Tag,
  title: Heading1,
  subtitle: Heading2,
  text: AlignLeft,
  image: ImageIcon,
  avatar: UserCircle,
  stat: BarChart3,
  progress: Gauge,
  badge: BadgeCheck,
  link: Link2,
  divider: Minus
}

const SPAN_LABELS: Record<number, string> = {
  3: '1/4',
  4: '1/3',
  6: '1/2',
  8: '2/3',
  12: 'Full'
}

function paletteZone(kind: WidgetBlockKind): WidgetZone {
  return ['eyebrow', 'title', 'subtitle', 'image', 'avatar', 'badge'].includes(kind) ? 'hero' : 'body'
}

function WidgetPaletteItem({ kind, onAdd }: { kind: WidgetBlockKind; onAdd: () => void }): React.JSX.Element {
  const definition = WIDGET_BLOCK_MAP[kind]
  const Icon = WIDGET_ICONS[kind]
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `widget-palette:${kind}`,
    data: { type: 'widget-palette', kind }
  })

  return (
    <div
      ref={setNodeRef}
      className={cn('palette-item compact', isDragging && 'dragging')}
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
        <Icon size={13} />
      </span>
      <span className="grow">
        <span className="palette-item-label">{definition.english}</span>
        <span className="palette-item-desc">{definition.description}</span>
      </span>
      <Plus size={11} className="palette-plus" />
    </div>
  )
}

function WidgetPalette(): React.JSX.Element {
  const addWidgetBlock = useAppStore((state) => state.addWidgetBlock)
  const setSelected = useUiStore((state) => state.setSelectedWidgetBlock)

  const add = (kind: WidgetBlockKind): void => {
    const zone = paletteZone(kind)
    addWidgetBlock(kind, zone)
    const state = useAppStore.getState()
    const block = [...state.widget.blocks].reverse().find((item) => item.kind === kind)
    if (block) setSelected(block.id)
  }

  return (
    <aside className="palette panel">
      <div className="palette-head">
        <div>
          <div className="palette-title">Widget blocks</div>
          <div className="palette-sub">Hero と Body に配置</div>
        </div>
        <Sparkles size={15} className="text-accent" />
      </div>
      <div className="palette-scroll">
        {(['Text', 'Media', 'Data'] as const).map((category) => (
          <div className="palette-group" key={category}>
            <div className="palette-group-label">{category}</div>
            {WIDGET_BLOCK_DEFS.filter((definition) => definition.category === category).map((definition) => (
              <WidgetPaletteItem key={definition.kind} kind={definition.kind} onAdd={() => add(definition.kind)} />
            ))}
          </div>
        ))}
      </div>
      <div className="palette-foot">
        <span className="dot" />
        <span>Drag → Hero / Body</span>
      </div>
    </aside>
  )
}

function WidgetBlockEditor({ block }: { block: WidgetBlock }): React.JSX.Element {
  const updateWidgetBlock = useAppStore((state) => state.updateWidgetBlock)
  const update = (patch: Partial<WidgetBlock>): void => updateWidgetBlock(block.id, patch)
  const textKinds: WidgetBlockKind[] = ['eyebrow', 'title', 'subtitle', 'text', 'link', 'badge']

  return (
    <div className="block-editor stack" style={{ gap: 12 }}>
      <div className="form-grid two">
        <Field label="Data source" help="Dynamic は Discord に送信する値、Static は見た目だけの固定値です。">
          <Segmented
            full
            value={block.source}
            options={[
              { value: 'dynamic', label: 'Dynamic' },
              { value: 'static', label: 'Static' }
            ]}
            onChange={(value) => update({ source: value })}
          />
        </Field>
        <Field label="Data Field" hint={block.source === 'dynamic' ? '必須' : 'Static'} htmlFor={`wf-${block.id}`}>
          <input
            id={`wf-${block.id}`}
            className="input mono"
            value={block.field}
            disabled={block.source === 'static'}
            placeholder="track_name"
            onChange={(event) => update({ field: event.target.value.replace(/\s/g, '_').slice(0, 64) })}
          />
        </Field>
      </div>

      <div className="form-grid two">
        <Field label="Value type" help="画像は https URL のみ送信できます。">
          <Segmented
            full
            value={block.valueType}
            options={[
              { value: 'text', label: 'Text' },
              { value: 'number', label: 'Number' },
              { value: 'image', label: 'Image' }
            ]}
            onChange={(value) => update({ valueType: value })}
          />
        </Field>
        <Field label="Width" hint={SPAN_LABELS[block.span]}>
          <Segmented
            full
            tiny
            value={block.span}
            options={WIDGET_SPANS.map((span) => ({ value: span, label: SPAN_LABELS[span] }))}
            onChange={(value) => update({ span: Number(value) as WidgetSpan })}
          />
        </Field>
      </div>

      {block.valueType === 'image' ? (
        <>
          <Field label="Image URL" hint="https://" htmlFor={`wv-${block.id}`}>
            <input
              id={`wv-${block.id}`}
              className="input mono"
              value={block.value}
              placeholder="https://cdn.example.com/cover.png"
              onChange={(event) => update({ value: event.target.value })}
            />
          </Field>
          {block.value && (
            <div className="asset-preview tall">
              <img src={block.value} alt="" />
            </div>
          )}
        </>
      ) : block.valueType === 'number' ? (
        <div className="form-grid two">
          <Field label="Sample value" hint="number" htmlFor={`wv-${block.id}`}>
            <input
              id={`wv-${block.id}`}
              className="input mono"
              value={block.value}
              placeholder="12480"
              onChange={(event) => update({ value: event.target.value })}
            />
          </Field>
          {block.kind === 'progress' && (
            <Field label="Max" htmlFor={`wm-${block.id}`}>
              <input
                id={`wm-${block.id}`}
                className="input mono"
                type="number"
                min={1}
                value={block.max}
                onChange={(event) => update({ max: Number(event.target.value) || 100 })}
              />
            </Field>
          )}
        </div>
      ) : (
        <Field label="Sample value" hint={`${block.value.length}/160`} htmlFor={`wv-${block.id}`}>
          <textarea
            id={`wv-${block.id}`}
            className="textarea"
            rows={textKinds.includes(block.kind) && block.kind !== 'text' ? 2 : 3}
            maxLength={160}
            value={block.value}
            placeholder="Midnight City"
            onChange={(event) => update({ value: event.target.value })}
          />
        </Field>
      )}

      {(block.kind === 'stat' || block.kind === 'progress' || block.kind === 'link') && (
        <Field label="Label" hint="見出し" htmlFor={`wl-${block.id}`}>
          <input
            id={`wl-${block.id}`}
            className="input"
            value={block.label}
            placeholder={block.kind === 'stat' ? 'SCROBBLES' : block.kind === 'progress' ? 'Album progress' : 'Open link'}
            onChange={(event) => update({ label: event.target.value })}
          />
        </Field>
      )}

      <div className="form-grid two">
        <Field label="Tone">
          <Segmented
            full
            tiny
            value={block.tone}
            options={[
              { value: 'default', label: 'Default' },
              { value: 'muted', label: 'Muted' },
              { value: 'accent', label: 'Accent' },
              { value: 'white', label: 'White' }
            ]}
            onChange={(value) => update({ tone: value })}
          />
        </Field>
        <Field label="Align">
          <Segmented
            full
            tiny
            value={block.align}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' }
            ]}
            onChange={(value) => update({ align: value })}
          />
        </Field>
      </div>
    </div>
  )
}

function SortableWidgetBlock({ block }: { block: WidgetBlock }): React.JSX.Element {
  const selectedId = useUiStore((state) => state.selectedWidgetBlockId)
  const setSelected = useUiStore((state) => state.setSelectedWidgetBlock)
  const removeWidgetBlock = useAppStore((state) => state.removeWidgetBlock)
  const updateWidgetBlock = useAppStore((state) => state.updateWidgetBlock)
  const selected = selectedId === block.id
  const definition = WIDGET_BLOCK_MAP[block.kind]
  const Icon = WIDGET_ICONS[block.kind]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: 'widget-block', zone: block.zone }
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('widget-block-card', selected && 'selected', isDragging && 'is-dragging')}
      onClick={(event) => {
        event.stopPropagation()
        setSelected(selected ? null : block.id)
      }}
    >
      <div className="widget-block-head">
        <button
          type="button"
          className="drag-handle"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label="ドラッグ"
        >
          <GripVertical size={13} />
        </button>
        <span className="widget-block-icon">
          <Icon size={13} />
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="widget-block-title">
            {definition.english}
            <span className={cn('pill mono', block.source === 'dynamic' ? 'accent' : '')}>{block.source === 'dynamic' ? 'DATA' : 'STATIC'}</span>
          </div>
          <div className="widget-block-sub truncate">
            {block.field || block.kind} · {block.value || 'empty'}
          </div>
        </div>
        <select
          className="mini-select"
          value={block.span}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            updateWidgetBlock(block.id, { span: Number(event.target.value) as WidgetSpan })
          }
          aria-label="幅"
        >
          {WIDGET_SPANS.map((span) => (
            <option key={span} value={span}>
              {SPAN_LABELS[span]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="icon-btn sm danger"
          onClick={(event) => {
            event.stopPropagation()
            removeWidgetBlock(block.id)
            if (selected) setSelected(null)
          }}
          aria-label="削除"
        >
          <Trash2 size={12} />
        </button>
        <ChevronDown size={13} className={cn('block-chevron', selected && 'open')} />
      </div>
      {selected && (
        <div onClick={(event) => event.stopPropagation()}>
          <WidgetBlockEditor block={block} />
        </div>
      )}
    </div>
  )
}

function DropZone({
  zone,
  title,
  subtitle,
  blocks,
  children
}: {
  zone: WidgetZone
  title: string
  subtitle: string
  blocks: WidgetBlock[]
  children: React.ReactNode
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: `zone:${zone}`, data: { type: 'zone', zone } })
  return (
    <div ref={setNodeRef} className={cn('drop-zone', isOver && 'over')}>
      <div className="drop-zone-head">
        <div>
          <div className="drop-zone-title">{title}</div>
          <div className="drop-zone-sub">{subtitle}</div>
        </div>
        <span className="pill mono">{blocks.length} blocks</span>
      </div>
      <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
        <div className="drop-zone-list">
          {children}
          <div className="drop-zone-empty">
            <Plus size={12} /> ここにドロップ
          </div>
        </div>
      </SortableContext>
    </div>
  )
}

function DataModelPanel(): React.JSX.Element {
  const widget = useAppStore((state) => state.widget)
  const updateWidget = useAppStore((state) => state.updateWidget)
  const setSelected = useUiStore((state) => state.setSelectedWidgetBlock)
  const [showPrimary, setShowPrimary] = useState(false)
  const persona = useActivePersona()
  const build = useMemo(() => buildWidgetPayload(widget, persona), [widget, persona])
  const fields = build.fields

  return (
    <div className="data-panel panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">
            <BarChart3 size={14} /> Data model
          </div>
          <div className="panel-sub">Discord に送る Dynamic Data と Metadata</div>
        </div>
        <span className={cn('pill', build.errors.length > 0 ? 'danger' : 'live')}>
          {build.errors.length > 0 ? `${build.errors.length} issues` : 'valid'}
        </span>
      </div>
      <div className="data-panel-body">
        <div className="field-table">
          <div className="field-table-head">
            <span>Data Field</span>
            <span>Type</span>
            <span>Sample</span>
            <span>Block</span>
          </div>
          {fields.length === 0 && <div className="field-table-empty">Dynamic field がありません。</div>}
          {fields.map((field) => {
            const block = widget.blocks.find((item) => item.id === field.blockId)
            return (
              <button
                type="button"
                className="field-table-row clickable"
                key={field.blockId}
                onClick={() => block && setSelected(block.id)}
              >
                <span className="mono">{field.name}</span>
                <span className="pill mono">{field.type.toUpperCase()}</span>
                <span className="truncate">{field.sample}</span>
                <span className="mono dim">{block ? WIDGET_BLOCK_MAP[block.kind].english : '—'}</span>
              </button>
            )
          })}
        </div>

        <div className="section-head" style={{ marginTop: 18 }}>
          <div className="section-title">
            <Link2 size={13} /> Metadata
            <span className="section-note">最大25件</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() =>
              updateWidget({ metadata: [...widget.metadata, { id: uid(), key: '', value: '' }] })
            }
          >
            <Plus size={12} /> 追加
          </button>
        </div>
        <div className="metadata-list">
          {widget.metadata.map((entry) => (
            <div className="metadata-row" key={entry.id}>
              <input
                className="input mono"
                placeholder="key"
                value={entry.key}
                onChange={(event) =>
                  updateWidget({
                    metadata: widget.metadata.map((item) =>
                      item.id === entry.id ? { ...item, key: event.target.value } : item
                    )
                  })
                }
              />
              <input
                className="input mono"
                placeholder="value"
                value={entry.value}
                onChange={(event) =>
                  updateWidget({
                    metadata: widget.metadata.map((item) =>
                      item.id === entry.id ? { ...item, value: event.target.value } : item
                    )
                  })
                }
              />
              <button
                type="button"
                className="icon-btn danger"
                onClick={() =>
                  updateWidget({ metadata: widget.metadata.filter((item) => item.id !== entry.id) })
                }
                aria-label="削除"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {widget.metadata.length === 0 && <div className="field-table-empty">Metadata はありません。</div>}
        </div>

        <div className="section-head" style={{ marginTop: 18 }}>
          <button type="button" className="section-title" onClick={() => setShowPrimary((value) => !value)}>
            <ChevronDown size={13} className={cn('block-chevron', showPrimary && 'open')} />
            Primary fields
            <span className="section-note">任意 · 既存Widget向け</span>
          </button>
        </div>
        {showPrimary && (
          <div className="form-grid two">
            {(
              [
                ['season', 'Season'],
                ['rank_name', 'Rank name'],
                ['highest_rank', 'Highest rank'],
                ['playtime_hours', 'Playtime hours'],
                ['total_wins', 'Total wins'],
                ['total_games', 'Total games'],
                ['server_name', 'Server name'],
                ['user_id', 'User ID']
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label} hint="任意" htmlFor={`primary-${key}`}>
                <input
                  id={`primary-${key}`}
                  className="input mono"
                  value={widget.primary[key]}
                  onChange={(event) =>
                    updateWidget({ primary: { ...widget.primary, [key]: event.target.value } })
                  }
                />
              </Field>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function WidgetsView(): React.JSX.Element {
  const widget = useAppStore((state) => state.widget)
  const updateWidget = useAppStore((state) => state.updateWidget)
  const settings = useAppStore((state) => state.settings)
  const moveWidgetBlocks = useAppStore((state) => state.moveWidgetBlocks)
  const insertWidgetBlock = useAppStore((state) => state.insertWidgetBlock)
  const persona = useActivePersona()
  const setPublishOpen = useUiStore((state) => state.setPublishOpen)
  const setSelected = useUiStore((state) => state.setSelectedWidgetBlock)
  const [activeDrag, setActiveDrag] = useState<{ type: 'palette'; kind: WidgetBlockKind } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const heroBlocks = widget.blocks.filter((block) => block.zone === 'hero')
  const bodyBlocks = widget.blocks.filter((block) => block.zone === 'body')
  const build = useMemo(() => buildWidgetPayload(widget, persona), [widget, persona])
  const appReady = isDiscordId(settings.appId)
  const userReady = isDiscordId(settings.userId)
  const readiness = !appReady
    ? 'Application ID を設定してください'
    : !userReady
      ? 'Discord User ID を設定してください'
      : build.errors.length > 0
        ? `${build.errors.length} issues to resolve`
        : 'Ready to publish'

  const onDragStart = (event: DragStartEvent): void => {
    const data = event.active.data.current
    if (data?.type === 'widget-palette') {
      setActiveDrag({ type: 'palette', kind: data.kind as WidgetBlockKind })
    } else {
      setActiveDrag(null)
    }
  }

  const onDragEnd = (event: DragEndEvent): void => {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return
    const overId = String(over.id)
    const overData = over.data.current
    const targetZone: WidgetZone =
      overData?.zone === 'hero' || overData?.zone === 'body'
        ? overData.zone
        : overId === 'zone:hero'
          ? 'hero'
          : overId === 'zone:body'
            ? 'body'
            : 'body'

    const data = active.data.current
    if (data?.type === 'widget-palette') {
      const kind = data.kind as WidgetBlockKind
      const zoneItems = widget.blocks.filter((block) => block.zone === targetZone)
      const index = overId.startsWith('zone:')
        ? zoneItems.length
        : Math.max(0, zoneItems.findIndex((block) => block.id === overId))
      const block = makeWidgetBlock(kind, targetZone)
      insertWidgetBlock(block, targetZone, index)
      setSelected(block.id)
      return
    }

    if (active.id !== over.id) {
      moveWidgetBlocks(String(active.id), overId, targetZone)
    }
  }

  return (
    <div className="view">
      <div className="view-inner">
        <PageHeader
          eyebrow="WIDGETS / COMPOSER"
          title={
            <>
              Build a <span className="title-accent">profile widget</span>
            </>
          }
          subtitle="Hero と Body にブロックを配置して、Widgets v2 のデータ構造と見た目を設計します。"
          actions={
            <>
              <Segmented
                value={widget.layout}
                options={[
                  { value: 'hero', label: 'Hero' },
                  { value: 'contained', label: 'Contained' }
                ]}
                onChange={(value) => updateWidget({ layout: value })}
              />
              <button type="button" className="btn btn-primary" onClick={() => setPublishOpen(true)}>
                <Send size={13} />
                Publish
              </button>
            </>
          }
        />

        <div className="widget-meta-strip">
          <div className="row">
            <span className={cn('dot', build.errors.length > 0 ? 'error' : !appReady || !userReady ? 'connecting' : 'live')} />
            <span className="semibold">{readiness}</span>
            <span className="dim">·</span>
            <span className="muted">{build.fields.length} dynamic fields</span>
            <span className="dim">·</span>
            <span className="muted">{Object.keys(build.payload.metadata ?? {}).length} metadata</span>
          </div>
          <div className="row">
            {widget.lastPublishedAt && (
              <span className="pill mono">
                LAST {new Date(widget.lastPublishedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="pill mono">{widget.layout.toUpperCase()}</span>
          </div>
        </div>

        <div className="widget-style-bar panel">
          <div className="style-field">
            <span className="style-label">
              <ImageIcon size={10} /> HERO BACKGROUND
            </span>
            <div className="style-inline">
              <span
                className="style-thumb"
                style={{ backgroundImage: widget.heroImage ? `url("${widget.heroImage}")` : undefined }}
              />
              <input
                className="input mono"
                value={widget.heroImage.startsWith('data:') ? '' : widget.heroImage}
                placeholder={widget.heroImage.startsWith('data:') ? 'ローカルアート（プレビュー用）' : 'https://…'}
                onChange={(event) => updateWidget({ heroImage: event.target.value })}
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => updateWidget({ heroImage: persona.banner })}
                title="ペルソナのバナーを背景に使う"
              >
                Persona
              </button>
              {widget.heroImage && (
                <button
                  type="button"
                  className="icon-btn sm"
                  onClick={() => updateWidget({ heroImage: '' })}
                  aria-label="背景をクリア"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="style-field">
            <span className="style-label">
              <Palette size={10} /> ACCENT
            </span>
            <div className="color-input">
              <div className="color-swatch" style={{ background: widget.accent }}>
                <input
                  type="color"
                  value={widget.accent}
                  onChange={(event) => updateWidget({ accent: event.target.value })}
                />
              </div>
              <span className="mono fs-11 muted">{widget.accent.toUpperCase()}</span>
            </div>
          </div>

          <div className="style-field">
            <span className="style-label">USERNAME SOURCE</span>
            <div className="style-inline">
              <Segmented
                tiny
                value={widget.usernameSource}
                options={[
                  { value: 'persona', label: 'Persona' },
                  { value: 'handle', label: 'Handle' },
                  { value: 'custom', label: 'Custom' }
                ]}
                onChange={(value) => updateWidget({ usernameSource: value })}
              />
              {widget.usernameSource === 'custom' && (
                <input
                  className="input mono"
                  value={widget.customUsername}
                  placeholder="username"
                  onChange={(event) => updateWidget({ customUsername: event.target.value })}
                />
              )}
            </div>
          </div>
        </div>

        <div className="widgets-grid">
          <WidgetPalette />

          <section className="widget-builder">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <div className="widget-zones">
                <DropZone zone="hero" title="Widget top" subtitle="Hero layout — 画像とメインコピー" blocks={heroBlocks}>
                  {heroBlocks.map((block) => (
                    <SortableWidgetBlock key={block.id} block={block} />
                  ))}
                </DropZone>
                <DropZone zone="body" title="Widget bottom" subtitle="Body layout — スタッツ、リンク、補足" blocks={bodyBlocks}>
                  {bodyBlocks.map((block) => (
                    <SortableWidgetBlock key={block.id} block={block} />
                  ))}
                </DropZone>
              </div>
              <DragOverlay dropAnimation={null}>
                {activeDrag && (
                  <div className="drag-overlay-card">
                    <span className="widget-block-icon">
                      {(() => {
                        const Icon = WIDGET_ICONS[activeDrag.kind]
                        return <Icon size={13} />
                      })()}
                    </span>
                    <span>{WIDGET_BLOCK_MAP[activeDrag.kind].english}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>

            <DataModelPanel />
          </section>

          <aside className="preview-pane widget-preview-pane">
            <div className="preview-context">
              <div className="row">
                <span className="preview-label">DISCORD PROFILE</span>
                <span className="dot live" />
              </div>
              <div className="preview-context-person">
                <img src={persona.avatar} alt="" />
                <span>{persona.name}</span>
                <span className="dim">@{persona.handle}</span>
              </div>
            </div>
            <WidgetPreview widget={widget} persona={persona} />
          </aside>
        </div>
      </div>
    </div>
  )
}
