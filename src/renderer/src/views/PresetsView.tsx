import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Code2,
  ExternalLink,
  Gamepad2,
  Image as ImageIcon,
  Music2,
  Palette,
  Play,
  Search,
  Sparkles,
  Wand2
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  CATEGORY_LABELS,
  CATEGORY_LABELS_JA,
  SIMULATION_PRESETS,
  presetAppIcon,
  presetArt,
  presetToPresence,
  type PresetCategory,
  type SimulationPreset
} from '../lib/presets'
import { ActivityPreview } from '../components/ActivityPreview'
import { CopyButton, EmptyState, Field, Modal, PageHeader, Segmented } from '../components/ui'
import { useAppStore, useActivePersona } from '../store/appStore'
import { toast, useUiStore } from '../store/uiStore'
import { goLive } from '../lib/live'
import { isDiscordId } from '../lib/format'

const CATEGORY_ICONS: Record<PresetCategory, LucideIcon> = {
  games: Gamepad2,
  dev: Code2,
  music: Music2,
  creative: Palette
}

const ACTIVITY_LABEL: Record<SimulationPreset['activityType'], string> = {
  playing: 'PLAYING',
  listening: 'LISTENING',
  watching: 'WATCHING',
  competing: 'COMPETING'
}

function PresetCard({
  preset,
  onSelect
}: {
  preset: SimulationPreset
  onSelect: () => void
}): React.JSX.Element {
  const art = useMemo(() => presetArt(preset), [preset])
  const Icon = CATEGORY_ICONS[preset.category]

  return (
    <article
      className="preset-card"
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="preset-art" style={{ backgroundImage: `url("${art}")` }}>
        <div className="preset-art-shade" />
        <div className="preset-art-top">
          <span className="pill mono">
            <Icon size={10} />
            {CATEGORY_LABELS[preset.category]}
          </span>
          <span className="pill mono">{ACTIVITY_LABEL[preset.activityType]}</span>
        </div>
        <div className="preset-art-copy">
          <div className="preset-art-app">{preset.appName}</div>
        </div>
      </div>
      <div className="preset-body">
        <div className="preset-name-row">
          <span className="preset-name">{preset.tagline}</span>
          <span className="preset-category-label">{CATEGORY_LABELS_JA[preset.category]}</span>
        </div>
        <p className="preset-description">{preset.description}</p>
        <div className="preset-chips">
          {preset.party && (
            <span className="chip">
              {preset.party.current}/{preset.party.max} party
            </span>
          )}
          {preset.buttons && preset.buttons.length > 0 && (
            <span className="chip">{preset.buttons.length} buttons</span>
          )}
          <span className="chip mono">{preset.assetKeys.length} assets</span>
        </div>
        <div className="preset-card-foot">
          <span className="dim fs-11">
            {preset.offsetMinutes >= 60
              ? `${Math.floor(preset.offsetMinutes / 60)}h ${Math.round(preset.offsetMinutes % 60)}m`
              : `${Math.round(preset.offsetMinutes)}m`}{' '}
            elapsed
          </span>
          <span className="btn btn-sm">
            Preview <ArrowUpRight size={11} />
          </span>
        </div>
      </div>
    </article>
  )
}

function PresetDetail({
  preset,
  onClose
}: {
  preset: SimulationPreset
  onClose: () => void
}): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const presence = useAppStore((state) => state.presence)
  const updatePresence = useAppStore((state) => state.updatePresence)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const setView = useUiStore((state) => state.setView)
  const persona = useActivePersona()
  const [appId, setAppId] = useState(settings.appId)

  useEffect(() => {
    setAppId(settings.appId)
  }, [preset.id, settings.appId])

  const previewPresence = useMemo(() => presetToPresence(preset, false), [preset])
  const previewPersona = useMemo(() => ({ ...persona, accent: preset.accent }), [persona, preset.accent])
  const previewSettings = useMemo(
    () => ({ ...settings, appId: appId || settings.appId, previewAppName: preset.appName }),
    [settings, appId, preset.appName]
  )
  const Icon = CATEGORY_ICONS[preset.category]

  const apply = async (startLive: boolean): Promise<void> => {
    const cleanAppId = appId.trim()
    if (cleanAppId && !isDiscordId(cleanAppId)) {
      toast('error', 'Application ID の形式が違います', '17〜20桁の数字で入力してください。')
      return
    }

    updatePresence({ ...presetToPresence(preset, presence.enabled) })
    updateSettings({
      previewAppName: preset.appName,
      previewAppIcon: presetAppIcon(preset),
      ...(cleanAppId ? { appId: cleanAppId } : {})
    })
    onClose()
    setView('studio')

    if (startLive) {
      toast('info', `${preset.name} を適用しました`, 'Discord に接続しています…')
      const ok = await goLive()
      if (!ok) {
        toast('warn', 'プリセットは適用済みです', 'Application ID を設定して Go live を押してください。')
      }
    } else {
      toast(
        'success',
        `${preset.name} を適用しました`,
        presence.enabled ? 'Live の Presence を更新しました。' : 'Go live で Discord に表示できます。'
      )
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${preset.name} preset`}
      description="ゲーム・開発ツール・音楽アプリの定番RPCを、Presence Studioのフィールドに展開します。"
      size="xl"
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost left"
            onClick={() =>
              void window.presenceStudio.widget.openExternal('https://discord.com/developers/applications')
            }
          >
            <ExternalLink size={13} /> Developer Portal
          </button>
          <button type="button" className="btn" onClick={() => void apply(false)}>
            <Wand2 size={13} /> Presence に適用
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void apply(true)}>
            <Play size={13} /> 適用して Go live
          </button>
        </>
      }
    >
      <div className="preset-detail-grid">
        <div className="stack" style={{ gap: 16 }}>
          <div className="preset-detail-head">
            <div className="preset-detail-icon" style={{ background: `${preset.accent}22`, color: preset.accent }}>
              <Icon size={20} />
            </div>
            <div className="grow">
              <div className="row" style={{ gap: 7 }}>
                <span className="preset-detail-app">{preset.appName}</span>
                <span className="pill mono">{CATEGORY_LABELS[preset.category]}</span>
              </div>
              <div className="preset-detail-tagline">{preset.tagline}</div>
            </div>
          </div>

          <p className="preset-detail-description">{preset.description}</p>

          <div className="preset-spec-grid">
            <div className="preset-spec">
              <span className="preset-spec-label">DETAILS</span>
              <span className="preset-spec-value">{preset.details}</span>
            </div>
            <div className="preset-spec">
              <span className="preset-spec-label">STATE</span>
              <span className="preset-spec-value">{preset.state}</span>
            </div>
            <div className="preset-spec">
              <span className="preset-spec-label">PARTY</span>
              <span className="preset-spec-value">
                {preset.party ? `${preset.party.current} / ${preset.party.max}` : '—'}
              </span>
            </div>
            <div className="preset-spec">
              <span className="preset-spec-label">ELAPSED</span>
              <span className="preset-spec-value">
                {preset.offsetMinutes >= 60
                  ? `${Math.floor(preset.offsetMinutes / 60)}h ${Math.round(preset.offsetMinutes % 60)}m`
                  : `${Math.round(preset.offsetMinutes)}m`}
              </span>
            </div>
          </div>

          <div className="callout warn">
            <AlertTriangle size={14} />
            <div>
              <strong>Discordに表示されるアプリ名・アイコンは、Application ID のアプリ情報です。</strong>
              このプリセット名を表示するには、Developer Portal で同じ名前のアプリを作成し、その Application ID を
              下に入力してください。画像は「Rich Presence → Art Assets」に下のキー名でアップロードすると表示されます。
            </div>
          </div>

          <Field
            label="このプリセットで使う Application ID"
            hint="任意"
            help="空欄の場合は現在の Application ID を使います。ゲーム名のアプリを別途作成している場合に入力してください。"
            error={appId && !isDiscordId(appId) ? '17〜20桁の数字で入力してください。' : null}
            htmlFor="preset-app-id"
          >
            <input
              id="preset-app-id"
              className="input mono"
              value={appId}
              placeholder={settings.appId || '123456789012345678'}
              onChange={(event) => setAppId(event.target.value.replace(/[^\d]/g, '').slice(0, 20))}
            />
          </Field>

          <div>
            <div className="preset-section-label">
              <ImageIcon size={12} /> Asset Keys
              <span>アップロードする画像のキー名</span>
            </div>
            <div className="preset-asset-list">
              {preset.assetKeys.map((asset, index) => (
                <div className="preset-asset-row" key={`${asset.key}-${index}`}>
                  <span className="preset-asset-index mono">{String(index + 1).padStart(2, '0')}</span>
                  <span className="preset-asset-key mono">{asset.key}</span>
                  <span className="preset-asset-desc">{asset.label}</span>
                  <CopyButton value={asset.key} label="コピー" className="btn-ghost" />
                </div>
              ))}
            </div>
          </div>

          {preset.buttons && preset.buttons.length > 0 && (
            <div>
              <div className="preset-section-label">
                <ArrowUpRight size={12} /> Buttons
              </div>
              <div className="preset-button-list">
                {preset.buttons.map((button) => (
                  <button
                    key={button.label}
                    type="button"
                    className="preset-button"
                    onClick={() => void window.presenceStudio.widget.openExternal(button.url)}
                  >
                    <span>{button.label}</span>
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="callout">
            <Sparkles size={14} />
            <div>
              プリセットは公開RPC実装のフィールド構造を参考にした<strong>ファンメイドのシミュレーション</strong>です。
              各ゲーム・アプリの公式提供ではありません。商標は各権利者に帰属します。
            </div>
          </div>
        </div>

        <aside className="preset-preview-aside">
          <div className="preset-preview-head">
            <span className="preview-label">LIVE PREVIEW</span>
            <span className="pill mono">{CATEGORY_LABELS[preset.category]}</span>
          </div>
          <ActivityPreview
            persona={previewPersona}
            presence={previewPresence}
            settings={previewSettings}
            live={false}
            appIcon={presetAppIcon(preset)}
          />
          <div className="preset-preview-note">
            <Check size={12} /> 実際のアプリ名は Application ID 側で決まります
          </div>
        </aside>
      </div>
    </Modal>
  )
}

export function PresetsView(): React.JSX.Element {
  const [category, setCategory] = useState<'all' | PresetCategory>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SimulationPreset | null>(null)

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('preset')
    if (!id) return
    const found = SIMULATION_PRESETS.find((preset) => preset.id === id)
    if (found) setSelected(found)
  }, [])

  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase()
    return SIMULATION_PRESETS.filter((preset) => {
      const matchesCategory = category === 'all' || preset.category === category
      const matchesQuery =
        !clean ||
        `${preset.name} ${preset.appName} ${preset.tagline} ${preset.description}`
          .toLowerCase()
          .includes(clean)
      return matchesCategory && matchesQuery
    })
  }, [category, query])

  return (
    <div className="view">
      <div className="view-inner">
        <PageHeader
          eyebrow="PRESETS / SIMULATION"
          title={
            <>
              Play as <span className="title-accent">anything</span>
            </>
          }
          subtitle="有名ゲーム・開発ツール・音楽アプリのRPC構成を、ワンクリックで Presence Studio に展開します。"
          actions={
            <span className="pill accent">
              <Sparkles size={11} /> {SIMULATION_PRESETS.length} presets
            </span>
          }
        />

        <div className="preset-info-banner">
          <div className="preset-info-icon">
            <Gamepad2 size={16} />
          </div>
          <div className="grow">
            <div className="preset-info-title">「そのゲームをプレイ中」の見た目をすばやく再現</div>
            <div className="preset-info-text">
              公開RPC実装のフィールド構造を参考にしたファンメイドのシミュレーションです。
              Discordのアプリ名とアイコンは Application ID のアプリ情報が表示されます。
              同じ名前のアプリを用意すると、より自然に見えます。
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              void window.presenceStudio.widget.openExternal(
                'https://github.com/4uthen7/presence-studio/blob/main/docs/PRESETS.md'
              )
            }
          >
            <ExternalLink size={12} /> 仕組み
          </button>
        </div>

        <div className="preset-toolbar">
          <div className="library-search">
            <Search size={13} />
            <input
              value={query}
              placeholder="ゲーム、アプリ、モードで検索…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Segmented
            value={category}
            options={[
              { value: 'all', label: 'All' },
              { value: 'games', label: 'Games' },
              { value: 'dev', label: 'Dev' },
              { value: 'music', label: 'Music' },
              { value: 'creative', label: 'Creative' }
            ]}
            onChange={(value) => setCategory(value as 'all' | PresetCategory)}
          />
          <span className="library-count mono">{filtered.length} / {SIMULATION_PRESETS.length}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={19} />}
            title="プリセットが見つかりません"
            text="検索語を短くするか、カテゴリを「All」に戻してみてください。"
          />
        ) : (
          <div className="preset-grid">
            {filtered.map((preset) => (
              <PresetCard key={preset.id} preset={preset} onSelect={() => setSelected(preset)} />
            ))}
          </div>
        )}
      </div>

      {selected && <PresetDetail preset={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
