import { useMemo, useState } from 'react'
import {
  Blocks,
  Copy,
  Download,
  FolderOpen,
  Image as ImageIcon,
  KeyRound,
  LibraryBig,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react'
import { Field, PageHeader } from '../components/ui'
import { useAppStore, toPersistedState } from '../store/appStore'
import { useUiStore, toast } from '../store/uiStore'
import {
  PRESENCE_TEMPLATES,
  WIDGET_TEMPLATES,
  createWidgetFromTemplate,
  templateArt
} from '../lib/templates'
import type { PresenceTemplate, WidgetTemplate } from '../lib/templates'
import { makePresenceBlock, uid } from '../lib/seed'
import { isHttpUrl } from '../lib/format'
import type { Asset, PresenceBlock } from '../../../shared/types'

type Filter = 'all' | 'presence' | 'widgets' | 'assets'

function PresenceTemplateCard({ template }: { template: PresenceTemplate }): React.JSX.Element {
  const updatePresence = useAppStore((state) => state.updatePresence)
  const setView = useUiStore((state) => state.setView)
  const art = useMemo(() => templateArt(template), [template])

  const apply = (): void => {
    const now = Date.now()
    const blocks: PresenceBlock[] = template.blocks.map((kind) => makePresenceBlock(kind))
    updatePresence({
      activityType: template.activityType,
      details: template.details,
      state: template.state,
      largeImageText: template.largeImageText,
      smallImageText: template.smallImageText,
      timestampMode: template.timestampMode,
      startISO: new Date(now - (template.timestampMode === 'elapsed' ? template.durationMinutes : 0) * 60_000).toISOString(),
      endISO: new Date(now + template.durationMinutes * 60_000).toISOString(),
      partyEnabled: Boolean(template.party),
      partyCurrent: String(template.party?.[0] ?? 2),
      partyMax: String(template.party?.[1] ?? 4),
      buttons: template.buttons.map((button) => ({ id: uid(), ...button })),
      blocks
    })
    toast('success', `${template.name} を適用しました`, 'Studio で内容を調整できます。')
    setView('studio')
  }

  return (
    <article className="template-card card-hover">
      <div className="template-art" style={{ backgroundImage: `url("${art}")` }}>
        <div className="template-art-shade" />
        <div className="template-art-top">
          <span className="pill mono">{template.tag}</span>
          <span className="template-icon">
            <Sparkles size={13} />
          </span>
        </div>
        <div className="template-art-copy">
          <div className="template-art-title">{template.name}</div>
          <div className="template-art-sub">{template.details}</div>
        </div>
      </div>
      <div className="template-body">
        <p className="template-desc">{template.description}</p>
        <div className="template-foot">
          <span className="dim fs-11">{template.blocks.length} blocks</span>
          <button type="button" className="btn btn-sm btn-primary" onClick={apply}>
            Use template
          </button>
        </div>
      </div>
    </article>
  )
}

function WidgetTemplateCard({ template }: { template: WidgetTemplate }): React.JSX.Element {
  const updateWidget = useAppStore((state) => state.updateWidget)
  const setView = useUiStore((state) => state.setView)
  const art = useMemo(() => templateArt(template), [template])

  const apply = (): void => {
    updateWidget(createWidgetFromTemplate(template))
    toast('success', `${template.name} を適用しました`, 'Widgets でデータフィールドを調整してください。')
    setView('widgets')
  }

  return (
    <article className="template-card card-hover">
      <div className="template-art" style={{ backgroundImage: `url("${art}")` }}>
        <div className="template-art-shade" />
        <div className="template-art-top">
          <span className="pill mono">{template.tag}</span>
          <span className="pill mono">{template.layout.toUpperCase()}</span>
        </div>
        <div className="template-art-copy">
          <div className="template-art-title">{template.name}</div>
          <div className="template-art-sub">{template.createBlocks().length} blocks · widget</div>
        </div>
      </div>
      <div className="template-body">
        <p className="template-desc">{template.description}</p>
        <div className="template-foot">
          <span className="dim fs-11">{template.createBlocks().length} blocks</span>
          <button type="button" className="btn btn-sm" onClick={apply}>
            Use template
          </button>
        </div>
      </div>
    </article>
  )
}

function AddAssetForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const addAsset = useAppStore((state) => state.addAsset)
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [kind, setKind] = useState<'image' | 'key'>('image')

  return (
    <div className="asset-add-form panel">
      <div className="panel-head">
        <div className="panel-title">
          <Plus size={13} /> Add asset
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
          閉じる
        </button>
      </div>
      <div className="panel-pad stack">
        <div className="form-grid two">
          <Field label="Name" htmlFor="asset-name">
            <input
              id="asset-name"
              className="input"
              value={name}
              placeholder="Night Drive cover"
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Type">
            <div className="segmented full">
              <button type="button" className={kind === 'image' ? 'active' : ''} onClick={() => setKind('image')}>
                <ImageIcon size={11} /> Image URL
              </button>
              <button type="button" className={kind === 'key' ? 'active' : ''} onClick={() => setKind('key')}>
                <KeyRound size={11} /> Asset key
              </button>
            </div>
          </Field>
        </div>
        <Field
          label={kind === 'image' ? 'Image URL' : 'Asset key'}
          hint={kind === 'image' ? 'https://' : 'Portal > Art Assets'}
          htmlFor="asset-value"
        >
          <input
            id="asset-value"
            className="input mono"
            value={value}
            placeholder={kind === 'image' ? 'https://cdn.example.com/cover.png' : 'night_drive_cover'}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start' }}
          disabled={!name.trim() || !value.trim() || (kind === 'image' && !isHttpUrl(value))}
          onClick={() => {
            addAsset({
              id: uid(),
              name: name.trim(),
              value: value.trim(),
              kind,
              createdAt: new Date().toISOString()
            })
            toast('success', 'アセットを追加しました')
            onClose()
          }}
        >
          <Plus size={13} /> Add asset
        </button>
      </div>
    </div>
  )
}

function AssetCard({ asset }: { asset: Asset }): React.JSX.Element {
  const removeAsset = useAppStore((state) => state.removeAsset)
  const isImage = asset.kind === 'image'
  return (
    <div className="asset-card">
      <div className="asset-thumb">
        {isImage ? <img src={asset.value} alt="" /> : <KeyRound size={18} />}
      </div>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="asset-name truncate">{asset.name}</div>
        <div className="asset-value mono truncate">{asset.value}</div>
      </div>
      <div className="row" style={{ gap: 2 }}>
        <button
          type="button"
          className="icon-btn sm"
          aria-label="コピー"
          onClick={async () => {
            await navigator.clipboard.writeText(asset.value)
            toast('success', 'コピーしました')
          }}
        >
          <Copy size={12} />
        </button>
        <button type="button" className="icon-btn sm danger" aria-label="削除" onClick={() => removeAsset(asset.id)}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

export function LibraryView(): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [addingAsset, setAddingAsset] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const assets = useAppStore((state) => state.assets)
  const assetsCount = assets.length

  const clean = query.trim().toLowerCase()
  const presence = PRESENCE_TEMPLATES.filter(
    (template) =>
      (!clean || `${template.name} ${template.description} ${template.tag}`.toLowerCase().includes(clean)) &&
      (filter === 'all' || filter === 'presence')
  )
  const widgets = WIDGET_TEMPLATES.filter(
    (template) =>
      (!clean || `${template.name} ${template.description} ${template.tag}`.toLowerCase().includes(clean)) &&
      (filter === 'all' || filter === 'widgets')
  )
  const filteredAssets = assets.filter(
    (asset) => !clean || `${asset.name} ${asset.value}`.toLowerCase().includes(clean)
  )
  const showAssets = filter === 'all' || filter === 'assets'

  const exportData = async (): Promise<void> => {
    const path = await window.presenceStudio.store.export(toPersistedState(useAppStore.getState()))
    if (path) toast('success', 'エクスポートしました', path)
  }

  const importData = async (): Promise<void> => {
    try {
      const state = await window.presenceStudio.store.import()
      if (state) {
        useAppStore.getState().replaceState(state)
        toast('success', 'インポートしました', 'ワークスペースを置き換えました。')
      }
    } catch (error) {
      toast('error', 'インポートできませんでした', error instanceof Error ? error.message : undefined)
    }
  }

  return (
    <div className="view">
      <div className="view-inner">
        <PageHeader
          eyebrow="LIBRARY / RESOURCES"
          title={
            <>
              Templates & <span className="title-accent">assets</span>
            </>
          }
          subtitle="すぐに使える Presence / Widget の構成と、画像アセットをまとめて管理します。"
          actions={
            <>
              <button type="button" className="btn" onClick={importData}>
                <Upload size={13} /> Import
              </button>
              <button type="button" className="btn btn-primary" onClick={exportData}>
                <Download size={13} /> Export
              </button>
            </>
          }
        />

        <div className="library-toolbar">
          <div className="library-search">
            <Search size={13} />
            <input
              value={query}
              placeholder="テンプレートやアセットを検索…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="segmented">
            {(
              [
                ['all', 'All'],
                ['presence', 'Presence'],
                ['widgets', 'Widgets'],
                ['assets', 'Assets']
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'active' : ''}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="library-count mono">
            {PRESENCE_TEMPLATES.length + WIDGET_TEMPLATES.length} templates · {assetsCount} assets
          </span>
        </div>

        {presence.length > 0 && (
          <>
            <div className="section-head">
              <div className="section-title">
                <Sparkles size={14} /> Presence templates
                <span className="section-note">クリックで Studio に適用</span>
              </div>
            </div>
            <div className="template-grid">
              {presence.map((template) => (
                <PresenceTemplateCard key={template.id} template={template} />
              ))}
            </div>
          </>
        )}

        {widgets.length > 0 && (
          <>
            <div className="section-head">
              <div className="section-title">
                <Blocks size={14} /> Widget blueprints
                <span className="section-note">データ構造と見た目の出発点</span>
              </div>
            </div>
            <div className="template-grid">
              {widgets.map((template) => (
                <WidgetTemplateCard key={template.id} template={template} />
              ))}
            </div>
          </>
        )}

        {showAssets && (
          <>
            <div className="section-head">
              <div className="section-title">
                <LibraryBig size={14} /> Assets
                <span className="section-note">RPC の Asset Key / 画像URL</span>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setAddingAsset((value) => !value)}>
                <Plus size={12} /> Add asset
              </button>
            </div>
            {addingAsset && <AddAssetForm onClose={() => setAddingAsset(false)} />}
            <div className="asset-grid">
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
              {filteredAssets.length === 0 && (
                <div className="empty" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-icon">
                    <ImageIcon size={18} />
                  </div>
                  <div className="empty-title">アセットがありません</div>
                  <div className="empty-text">画像URLやDeveloper PortalのAsset Keyを登録しておくと、Presence編集時にすぐ使えます。</div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="section-head">
          <div className="section-title">
            <FolderOpen size={14} /> Workspace
            <span className="section-note">データはこの端末に保存されます</span>
          </div>
        </div>
        <div className="workspace-card panel">
          <div className="panel-pad row" style={{ flexWrap: 'wrap', gap: 14 }}>
            <div className="grow">
              <div className="toggle-row-title">Presence Studio workspace</div>
              <div className="toggle-row-desc">
                Presence、Widget、ペルソナ、アセットをJSONでバックアップできます。
              </div>
            </div>
            <button type="button" className="btn btn-sm" onClick={exportData}>
              <Download size={12} /> Export JSON
            </button>
            <button type="button" className="btn btn-sm" onClick={importData}>
              <Upload size={12} /> Import JSON
            </button>
            <button type="button" className="btn btn-sm" onClick={() => window.presenceStudio.store.openDataFolder()}>
              <FolderOpen size={12} /> データフォルダ
            </button>
            <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={12} /> リセット
            </button>
          </div>
          {confirmReset && (
            <div className="confirm-panel" style={{ margin: '0 18px 18px' }}>
              <div className="confirm-icon">
                <RotateCcw size={17} />
              </div>
              <div className="grow">
                <div className="confirm-title">ワークスペースを初期化しますか？</div>
                <div className="confirm-desc">保存済みのデータは削除され、サンプル状態に戻ります。</div>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setConfirmReset(false)}>
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={async () => {
                  await window.presenceStudio.store.reset()
                  useAppStore.getState().resetWorkspace()
                  setConfirmReset(false)
                  toast('info', 'ワークスペースを初期化しました')
                }}
              >
                初期化する
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
