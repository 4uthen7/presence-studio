import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FolderOpen,
  Gauge,
  KeyRound,
  Laptop,
  Palette,
  PlugZap,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Unplug,
  Upload,
  Wifi
} from 'lucide-react'
import { Field, PageHeader, Segmented, Switch } from '../components/ui'
import { useAppStore, toPersistedState, useActivePersona } from '../store/appStore'
import { toast } from '../store/uiStore'
import { isDiscordId } from '../lib/format'
import { cn } from '../lib/cn'

const ACCENTS = ['#8b7cff', '#62e6c4', '#ff7ac8', '#5aa9ff', '#f5c46b', '#ff8a5b', '#b28cff', '#7dd3fc']

export function SettingsView(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const widget = useAppStore((state) => state.widget)
  const persona = useActivePersona()
  const updatePresence = useAppStore((state) => state.updatePresence)
  const publishLog = useAppStore((state) => state.publishLog)
  const [info, setInfo] = useState<{ version: string; platform: string; dataPath: string } | null>(null)
  const [token, setToken] = useState<{ hasToken: boolean; storage: 'dpapi' | 'none' }>({
    hasToken: false,
    storage: 'none'
  })
  const [connecting, setConnecting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    void window.presenceStudio.system.getInfo().then(setInfo)
    void window.presenceStudio.widget.tokenStatus().then(setToken)
  }, [])

  const connect = async (): Promise<void> => {
    if (!isDiscordId(settings.appId)) {
      toast('error', 'Application ID を確認してください', '17〜20桁の数字です。')
      return
    }
    setConnecting(true)
    try {
      const status = await window.presenceStudio.rpc.connect(settings.appId)
      if (status.state === 'connected') {
        toast('success', 'Discord に接続しました', status.user?.username)
      } else {
        toast('error', '接続できませんでした', status.message)
      }
    } finally {
      setConnecting(false)
    }
  }

  const exportData = async (): Promise<void> => {
    const path = await window.presenceStudio.store.export(toPersistedState(useAppStore.getState()))
    if (path) toast('success', 'エクスポートしました', path)
  }

  const importData = async (): Promise<void> => {
    try {
      const state = await window.presenceStudio.store.import()
      if (state) {
        useAppStore.getState().replaceState(state)
        toast('success', 'インポートしました')
      }
    } catch (error) {
      toast('error', 'インポートできませんでした', error instanceof Error ? error.message : undefined)
    }
  }

  return (
    <div className="view">
      <div className="view-inner settings-view">
        <PageHeader
          eyebrow="SETTINGS / PREFERENCES"
          title={
            <>
              Tune the <span className="title-accent">studio</span>
            </>
          }
          subtitle="接続、Widget の公開、見た目、システム動作をまとめて設定します。"
          actions={
            <span className="pill live">
              <CheckCircle2 size={11} /> 自動保存
            </span>
          }
        />

        <div className="settings-grid">
          <section className="panel settings-card">
            <div className="panel-head">
              <div>
                <div className="panel-title">
                  <Wifi size={14} /> Discord connection
                </div>
                <div className="panel-sub">Application ID と IPC 接続</div>
              </div>
              <span className={cn('pill', settings.appId ? 'accent' : 'warn')}>
                {settings.appId ? 'APP SET' : 'NO APP'}
              </span>
            </div>
            <div className="panel-pad stack" style={{ gap: 14 }}>
              <Field
                label="Application ID"
                hint="17–20 digits"
                error={settings.appId && !isDiscordId(settings.appId) ? '数字のみ・17〜20桁で入力してください。' : null}
                help="Discord Developer Portal → Applications → General Information。"
                htmlFor="set-app-id"
              >
                <input
                  id="set-app-id"
                  className="input mono"
                  value={settings.appId}
                  placeholder="123456789012345678"
                  onChange={(event) =>
                    updateSettings({ appId: event.target.value.replace(/[^\d]/g, '').slice(0, 20) })
                  }
                />
              </Field>
              <Field label="プレビュー用アプリ名" hint="表示のみ" htmlFor="set-preview-name">
                <input
                  id="set-preview-name"
                  className="input"
                  value={settings.previewAppName}
                  onChange={(event) => updateSettings({ previewAppName: event.target.value.slice(0, 60) })}
                />
              </Field>
              <div className="toggle-row">
                <div className="toggle-row-copy">
                  <div className="toggle-row-title">起動時に自動接続</div>
                  <div className="toggle-row-desc">Discord が起動していればバックグラウンドで接続します。</div>
                </div>
                <Switch checked={settings.autoConnect} onChange={(value) => updateSettings({ autoConnect: value })} />
              </div>
              <div className="row">
                <button type="button" className="btn btn-primary" onClick={connect} disabled={connecting}>
                  <PlugZap size={13} /> 接続テスト
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    await window.presenceStudio.rpc.disconnect()
                    updatePresence({ enabled: false })
                    toast('info', '切断しました')
                  }}
                >
                  <Unplug size={13} /> 切断
                </button>
              </div>
            </div>
          </section>

          <section className="panel settings-card">
            <div className="panel-head">
              <div>
                <div className="panel-title">
                  <KeyRound size={14} /> Widget publishing
                </div>
                <div className="panel-sub">Widgets v2 のプロフィール更新</div>
              </div>
              <span className={cn('pill', token.hasToken ? 'live' : 'warn')}>
                {token.hasToken ? 'TOKEN SAVED' : 'NO TOKEN'}
              </span>
            </div>
            <div className="panel-pad stack" style={{ gap: 14 }}>
              <Field
                label="Discord User ID"
                hint="17–20 digits"
                help="自分のプロフィールを右クリック →「IDをコピー」（開発者モードON）。"
                htmlFor="set-user-id"
              >
                <input
                  id="set-user-id"
                  className="input mono"
                  value={settings.userId}
                  placeholder="123456789012345678"
                  onChange={(event) =>
                    updateSettings({ userId: event.target.value.replace(/[^\d]/g, '').slice(0, 20) })
                  }
                />
              </Field>
              <Field
                label="OAuth Redirect URI"
                hint="Portal と一致"
                help="Developer Portal の OAuth2 → Redirects に登録したURL。"
                htmlFor="set-redirect"
              >
                <input
                  id="set-redirect"
                  className="input mono"
                  value={settings.redirectUri}
                  onChange={(event) => updateSettings({ redirectUri: event.target.value })}
                />
              </Field>
              <div className="token-status-row">
                <div className="row">
                  <ShieldCheck size={14} className={token.hasToken ? 'text-ok' : 'dim'} />
                  <div>
                    <div className="toggle-row-title">Bot token</div>
                    <div className="toggle-row-desc">
                      {token.hasToken
                        ? `暗号化して保存済み（${token.storage === 'dpapi' ? 'Windows DPAPI' : 'secure storage'}）`
                        : '未保存 — Publish 時に設定できます'}
                    </div>
                  </div>
                </div>
                {token.hasToken && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost text-danger"
                    onClick={async () => {
                      await window.presenceStudio.widget.clearToken()
                      setToken({ ...token, hasToken: false })
                      toast('info', '保存済みトークンを削除しました')
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="row">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    void window.presenceStudio.widget.openExternal('https://discord.com/developers/applications')
                  }
                >
                  <ExternalLink size={12} /> Developer Portal
                </button>
                <span className="dim fs-11">
                  Last publish: {widget.lastPublishedAt ? new Date(widget.lastPublishedAt).toLocaleString('ja-JP') : '未公開'}
                </span>
              </div>

              {publishLog.length > 0 && (
                <div className="publish-history">
                  <div className="publish-history-label">RECENT PUBLISHES</div>
                  {publishLog.slice(0, 3).map((entry) => (
                    <div className="publish-history-row" key={entry.id}>
                      <span className={cn('dot', entry.status === 'success' ? 'live' : 'error')} />
                      <span className="mono">{new Date(entry.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="grow truncate">{entry.message}</span>
                      <span className="mono dim">{entry.appId.slice(0, 6)}…</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="panel settings-card">
            <div className="panel-head">
              <div>
                <div className="panel-title">
                  <Palette size={14} /> Appearance
                </div>
                <div className="panel-sub">アクセントと密度</div>
              </div>
            </div>
            <div className="panel-pad stack" style={{ gap: 14 }}>
              <Field label="アクセントカラー" hint={settings.accent.toUpperCase()}>
                <div className="color-input">
                  <div className="color-swatch" style={{ background: settings.accent }}>
                    <input
                      type="color"
                      value={settings.accent}
                      onChange={(event) => updateSettings({ accent: event.target.value })}
                    />
                  </div>
                  <div className="color-presets">
                    {ACCENTS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn('color-preset', settings.accent === color && 'active')}
                        style={{ background: color }}
                        onClick={() => updateSettings({ accent: color })}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>
              </Field>
              <div className="toggle-row">
                <div className="toggle-row-copy">
                  <div className="toggle-row-title">モーションを減らす</div>
                  <div className="toggle-row-desc">アニメーションとトランジションを最小化します。</div>
                </div>
                <Switch checked={settings.reduceMotion} onChange={(value) => updateSettings({ reduceMotion: value })} />
              </div>
              <Field label="密度">
                <Segmented
                  full
                  value={settings.density}
                  options={[
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'compact', label: 'Compact' }
                  ]}
                  onChange={(value) => updateSettings({ density: value })}
                />
              </Field>
              <div className="accent-preview">
                <span className="accent-preview-orb" style={{ background: settings.accent }} />
                <div>
                  <div className="toggle-row-title">{persona.name}</div>
                  <div className="toggle-row-desc">アクティブペルソナ · {persona.accent}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="panel settings-card">
            <div className="panel-head">
              <div>
                <div className="panel-title">
                  <Laptop size={14} /> System
                </div>
                <div className="panel-sub">起動とバックグラウンド動作</div>
              </div>
            </div>
            <div className="panel-pad stack" style={{ gap: 0 }}>
              <div className="toggle-row">
                <div className="toggle-row-copy">
                  <div className="toggle-row-title">Windows 起動時に開く</div>
                  <div className="toggle-row-desc">ログイン時に Presence Studio を起動します。</div>
                </div>
                <Switch
                  checked={settings.launchAtLogin}
                  onChange={(value) => {
                    updateSettings({ launchAtLogin: value })
                    void window.presenceStudio.system.setLaunchAtLogin(value)
                  }}
                />
              </div>
              <div className="toggle-row">
                <div className="toggle-row-copy">
                  <div className="toggle-row-title">閉じたらトレイに残す</div>
                  <div className="toggle-row-desc">Presence を生かしたままバックグラウンドで動作します。</div>
                </div>
                <Switch
                  checked={settings.minimizeToTray}
                  onChange={(value) => updateSettings({ minimizeToTray: value })}
                />
              </div>
              <div className="toggle-row">
                <div className="toggle-row-copy">
                  <div className="toggle-row-title">グローバルホットキー</div>
                  <div className="toggle-row-desc">
                    <span className="kbd">Ctrl</span> <span className="kbd">Shift</span> <span className="kbd">P</span> で
                    Presence を開始 / 停止。
                  </div>
                </div>
                <Switch checked={settings.hotkeyEnabled} onChange={(value) => updateSettings({ hotkeyEnabled: value })} />
              </div>
              <div className="toggle-row">
                <div className="toggle-row-copy">
                  <div className="toggle-row-title">Presence の更新間隔</div>
                  <div className="toggle-row-desc">接続維持のため、指定秒ごとにアクティビティを再送信します。</div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <input
                    className="input mono"
                    type="number"
                    min={15}
                    max={300}
                    value={settings.refreshSeconds}
                    style={{ width: 70 }}
                    onChange={(event) =>
                      updateSettings({
                        refreshSeconds: Math.max(15, Math.min(300, Number(event.target.value) || 60))
                      })
                    }
                  />
                  <span className="dim fs-11">sec</span>
                </div>
              </div>
            </div>
          </section>

          <section className="panel settings-card">
            <div className="panel-head">
              <div>
                <div className="panel-title">
                  <Database size={14} /> Data
                </div>
                <div className="panel-sub">バックアップと保存先</div>
              </div>
              <span className="pill mono">LOCAL</span>
            </div>
            <div className="panel-pad stack" style={{ gap: 12 }}>
              <div className="copy-row">
                <FolderOpen size={13} />
                <span className="grow" title={info?.dataPath}>
                  {info?.dataPath ?? '…'}
                </span>
                <button
                  type="button"
                  className="icon-btn sm"
                  onClick={() => window.presenceStudio.store.openDataFolder()}
                  aria-label="開く"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-sm" onClick={exportData}>
                  <Download size={12} /> Export
                </button>
                <button type="button" className="btn btn-sm" onClick={importData}>
                  <Upload size={12} /> Import
                </button>
                <button type="button" className="btn btn-sm btn-ghost text-danger" onClick={() => setConfirmReset(true)}>
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
              <p className="field-help">
                ワークスペースは <span className="mono">presence-studio.json</span> に保存されます。Bot token
                は別ファイルに暗号化して保存され、エクスポートには含まれません。
              </p>
              {confirmReset && (
                <div className="confirm-panel" style={{ padding: 12 }}>
                  <div className="confirm-icon">
                    <RotateCcw size={16} />
                  </div>
                  <div className="grow">
                    <div className="confirm-title">初期化しますか？</div>
                    <div className="confirm-desc">保存データは削除されます。</div>
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
                      toast('info', '初期化しました')
                    }}
                  >
                    初期化
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="panel settings-card about-card">
            <div className="panel-head">
              <div>
                <div className="panel-title">
                  <Sparkles size={14} /> About
                </div>
                <div className="panel-sub">Presence Studio {info?.version ?? '0.2.0'}</div>
              </div>
              <span className="pill mono">{info?.platform ?? 'win32'}</span>
            </div>
            <div className="panel-pad stack" style={{ gap: 12 }}>
              <p className="about-copy">
                Discord Rich Presence、プロフィール Widget、ペルソナをひとつのデスクトップスタジオで。Advanced
                DiscordRPC にインスパイアされた、ブロックベースのプリセンスツールです。
              </p>
              <div className="about-links">
                <button
                  type="button"
                  className="about-link"
                  onClick={() =>
                    void window.presenceStudio.widget.openExternal('https://discord.com/developers/applications')
                  }
                >
                  <ExternalLink size={12} /> Developer Portal
                </button>
                <button
                  type="button"
                  className="about-link"
                  onClick={() =>
                    void window.presenceStudio.widget.openExternal('https://docs.discord.food/resources/widgets')
                  }
                >
                  <ExternalLink size={12} /> Widget API
                </button>
                <button
                  type="button"
                  className="about-link"
                  onClick={() =>
                    void window.presenceStudio.widget.openExternal('https://discord.com/developers/docs/topics/rpc')
                  }
                >
                  <ExternalLink size={12} /> RPC docs
                </button>
                <button
                  type="button"
                  className="about-link"
                  onClick={() =>
                    void window.presenceStudio.widget.openExternal('https://github.com/iseizuu/Advanced-DiscordRPC')
                  }
                >
                  <ExternalLink size={12} /> Inspiration
                </button>
              </div>
              <div className="about-note">
                <Gauge size={12} />
                <span>Electron · React · TypeScript · ローカルJSON · 外部送信は Discord API のみ</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
