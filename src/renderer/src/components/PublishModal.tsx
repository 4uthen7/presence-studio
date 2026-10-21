import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  KeyRound,
  Loader2,
  Send,
  ShieldCheck
} from 'lucide-react'
import { Field, Modal, Switch } from './ui'
import { WidgetPreview } from './WidgetPreview'
import { useAppStore, useActivePersona } from '../store/appStore'
import { useUiStore, toast } from '../store/uiStore'
import { buildWidgetPayload } from '../lib/widget'
import { isDiscordId } from '../lib/format'
import { cn } from '../lib/cn'
import type { PublishResponse } from '../../../shared/types'

export function PublishModal(): React.JSX.Element | null {
  const open = useUiStore((state) => state.publishOpen)
  const setOpen = useUiStore((state) => state.setPublishOpen)
  const widget = useAppStore((state) => state.widget)
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const updateWidget = useAppStore((state) => state.updateWidget)
  const addPublishLog = useAppStore((state) => state.addPublishLog)
  const persona = useActivePersona()
  const [token, setToken] = useState('')
  const [remember, setRemember] = useState(true)
  const [hasStoredToken, setHasStoredToken] = useState(false)
  const [storage, setStorage] = useState<'dpapi' | 'none'>('none')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<PublishResponse | null>(null)
  const [showJson, setShowJson] = useState(false)
  const [showFields, setShowFields] = useState(false)

  const build = useMemo(() => buildWidgetPayload(widget, persona), [widget, persona])
  const json = useMemo(() => JSON.stringify(build.payload, null, 2), [build.payload])
  const appId = settings.appId.trim()
  const userId = settings.userId.trim()
  const canPublish =
    isDiscordId(appId) &&
    isDiscordId(userId) &&
    build.errors.length === 0 &&
    (Boolean(token) || hasStoredToken) &&
    accepted &&
    !busy

  useEffect(() => {
    if (!open) return
    setResult(null)
    setAccepted(false)
    setToken('')
    setShowJson(false)
    setShowFields(false)
    void window.presenceStudio.widget.tokenStatus().then((status) => {
      setHasStoredToken(status.hasToken)
      setStorage(status.storage)
    })
  }, [open])

  const oauthUrl = useMemo(() => {
    if (!isDiscordId(appId)) return ''
    const redirect = settings.redirectUri || 'https://discord.com/'
    return `https://discord.com/oauth2/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirect
    )}&response_type=token&scope=openid+sdk.social_layer`
  }, [appId, settings.redirectUri])

  const publish = async (): Promise<void> => {
    if (!canPublish) return
    setBusy(true)
    setResult(null)
    try {
      const response = await window.presenceStudio.widget.publish({
        appId,
        userId,
        token: token || undefined,
        rememberToken: remember && Boolean(token),
        payload: build.payload
      })
      setResult(response)
      if (response.ok) {
        const at = new Date().toISOString()
        updateWidget({ lastPublishedAt: at })
        addPublishLog({
          id: crypto.randomUUID(),
          at,
          appId,
          status: 'success',
          message: response.message
        })
        setHasStoredToken(remember && Boolean(token) ? true : hasStoredToken)
        toast('success', 'Widget data を公開しました', `HTTP ${response.status} · ${persona.name}`)
      } else {
        addPublishLog({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          appId,
          status: 'error',
          message: response.message
        })
        toast('error', '公開に失敗しました', response.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Publish widget data"
      description="Widget の動的データを Discord のプロフィールへ送信します。"
      size="xl"
      footer={
        <>
          <button type="button" className="btn btn-ghost left" onClick={() => setShowJson((value) => !value)}>
            <ClipboardCheck size={13} />
            {showJson ? 'フォームに戻る' : 'JSON を確認'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              await navigator.clipboard.writeText(json)
              toast('success', 'JSON をコピーしました')
            }}
          >
            JSON をコピー
          </button>
          <button type="button" className="btn btn-primary" disabled={!canPublish} onClick={publish}>
            {busy ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
            公開する
          </button>
        </>
      }
    >
      <div className="publish-grid">
        <div className="stack" style={{ gap: 14 }}>
          {showJson ? (
            <div className="stack">
              <div className="row-between">
                <div className="section-title">送信する JSON</div>
                <span className="pill mono">PATCH /identities/0/profile</span>
              </div>
              <pre className="code-block">{json}</pre>
              {build.errors.length > 0 && (
                <div className="callout danger">
                  <AlertTriangle size={14} />
                  <div>
                    {build.errors.map((error) => (
                      <div key={error}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="publish-step">
                <div className="publish-step-index">1</div>
                <div className="grow">
                  <div className="publish-step-title">Application とユーザー</div>
                  <div className="publish-step-desc">
                    Developer Portal のアプリと、ウィジェットを表示する自分のアカウントを指定します。
                  </div>
                </div>
              </div>

              <div className="form-grid two">
                <Field label="Application ID" hint="必須" htmlFor="pub-app">
                  <input
                    id="pub-app"
                    className="input mono"
                    value={settings.appId}
                    placeholder="123456789012345678"
                    onChange={(event) =>
                      updateSettings({ appId: event.target.value.replace(/[^\d]/g, '').slice(0, 20) })
                    }
                  />
                </Field>
                <Field
                  label="Discord User ID"
                  hint="必須"
                  help="Discord 設定 → 詳細設定 → 開発者モードをON → 自分のプロフィールを右クリック → IDをコピー。"
                  htmlFor="pub-user"
                >
                  <input
                    id="pub-user"
                    className="input mono"
                    value={settings.userId}
                    placeholder="123456789012345678"
                    onChange={(event) =>
                      updateSettings({ userId: event.target.value.replace(/[^\d]/g, '').slice(0, 20) })
                    }
                  />
                </Field>
              </div>

              <Field
                label="Bot Token"
                hint={hasStoredToken ? '保存済み' : '必須'}
                help={
                  storage === 'dpapi'
                    ? '保存する場合、Windows の DPAPI で暗号化してこの端末にのみ保存します。'
                    : 'この環境では安全な保存が利用できません。トークンは保存されません。'
                }
                htmlFor="pub-token"
              >
                <div className="input-wrap">
                  <KeyRound size={13} className="input-prefix" style={{ left: 10 }} />
                  <input
                    id="pub-token"
                    className="input mono"
                    style={{ paddingLeft: 30 }}
                    type="password"
                    value={token}
                    placeholder={hasStoredToken ? '保存済みのトークンを使用（変更する場合のみ入力）' : 'Bot token'}
                    onChange={(event) => setToken(event.target.value)}
                    autoComplete="off"
                  />
                </div>
              </Field>

              <div className="toggle-row" style={{ paddingTop: 0 }}>
                <div className="toggle-row-copy">
                  <div className="toggle-row-title">この端末にトークンを保存</div>
                  <div className="toggle-row-desc">次回から入力不要になります。共有PCではオフにしてください。</div>
                </div>
                <Switch checked={remember} onChange={setRemember} />
              </div>

              <div className="publish-step">
                <div className="publish-step-index">2</div>
                <div className="grow">
                  <div className="publish-step-title">プロフィールへのアクセスを承認</div>
                  <div className="publish-step-desc">
                    Social SDK のスコープ <code>sdk.social_layer</code> を付けてアプリを承認します。承認後、このページに戻ってください。
                  </div>
                  <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={!oauthUrl}
                      onClick={() => oauthUrl && void window.presenceStudio.widget.openExternal(oauthUrl)}
                    >
                      <ExternalLink size={12} />
                      OAuth を開く
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() =>
                        void window.presenceStudio.widget.openExternal(
                          'https://discord.com/developers/applications'
                        )
                      }
                    >
                      Bot 設定を開く
                    </button>
                  </div>
                  <Field
                    label="Redirect URI"
                    hint="OAuth2 → Redirects に登録"
                    help="Developer Portal の OAuth2 ページに登録したURLと同じものを指定してください。"
                    htmlFor="pub-redirect"
                  >
                    <input
                      id="pub-redirect"
                      className="input mono"
                      value={settings.redirectUri}
                      onChange={(event) => updateSettings({ redirectUri: event.target.value })}
                      placeholder="https://discord.com/"
                    />
                  </Field>
                </div>
              </div>

              <div className="publish-step">
                <div className="publish-step-index">3</div>
                <div className="grow">
                  <div className="publish-step-title">送信内容を確認</div>
                  <div className="publish-step-desc">
                    {build.fields.length} 個の Dynamic field、{Object.keys(build.payload.metadata ?? {}).length} 個の
                    Metadata を送信します。
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    style={{ marginTop: 6 }}
                    onClick={() => setShowFields((value) => !value)}
                  >
                    <ClipboardCheck size={12} />
                    {showFields ? 'フィールド一覧を閉じる' : 'フィールド一覧を表示'}
                  </button>
                </div>
              </div>

              {showFields && (
                <div className="field-table">
                  <div className="field-table-head">
                    <span>Data Field</span>
                    <span>Type</span>
                    <span>Sample</span>
                    <span />
                  </div>
                  {build.fields.length === 0 && (
                    <div className="field-table-empty">Dynamic field がありません。Widget タブでブロックを追加してください。</div>
                  )}
                  {build.fields.map((field) => (
                    <div className="field-table-row" key={field.blockId}>
                      <span className="mono">{field.name || '—'}</span>
                      <span className="pill mono">{field.type.toUpperCase()}</span>
                      <span className="truncate">{field.sample}</span>
                      <span>
                        {field.valid ? (
                          <CheckCircle2 size={12} className="text-ok" />
                        ) : (
                          <AlertTriangle size={12} className="text-warn" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(build.errors.length > 0 || build.warnings.length > 0) && (
                <div className={cn('callout', build.errors.length > 0 ? 'danger' : 'warn')}>
                  <AlertTriangle size={14} />
                  <div className="stack" style={{ gap: 4 }}>
                    {build.errors.map((error) => (
                      <div key={error}>{error}</div>
                    ))}
                    {build.warnings.map((warning) => (
                      <div key={warning}>{warning}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="callout warn">
                <ShieldCheck size={14} />
                <div>
                  <strong>実験的な機能です。</strong> Widgets v2 は Discord の公式ドキュメントが未整備で、仕様が変更・停止される可能性があります。自分が管理するアプリとアカウントでのみ使用し、他者へのなりすましやスパムに使わないでください。
                </div>
              </div>

              <label className="checkbox">
                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
                <span>Widgets v2 の実験的な仕様とリスクを理解し、自分の責任で送信します。</span>
              </label>

              {result && (
                <div className={cn('publish-result', result.ok ? 'ok' : 'error')}>
                  <div className="row-between">
                    <div className="row">
                      {result.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                      <strong>{result.ok ? '送信しました' : '送信に失敗しました'}</strong>
                    </div>
                    <span className="pill mono">HTTP {result.status || '—'}</span>
                  </div>
                  <div className="publish-result-message">{result.message}</div>
                  {result.body && <pre className="code-block small">{result.body}</pre>}
                  {result.ok && (
                    <div className="publish-result-hint">
                      Discord のプロフィールにウィジェットを追加すると表示されます。反映されない場合は、Discord を再起動するか、しばらく待ってください。
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="publish-aside">
          <div className="publish-aside-head">
            <span className="preview-label">LIVE COMPOSITION</span>
            <span className="pill mono">{persona.name}</span>
          </div>
          <WidgetPreview widget={widget} persona={persona} showChrome={false} />
          <div className="publish-aside-meta">
            <div className="row-between">
              <span className="dim">Last published</span>
              <span className="mono fs-11">
                {widget.lastPublishedAt ? new Date(widget.lastPublishedAt).toLocaleString('ja-JP') : '未公開'}
              </span>
            </div>
            <div className="row-between">
              <span className="dim">Endpoint</span>
              <span className="mono fs-11">identities/0/profile</span>
            </div>
            <div className="row-between">
              <span className="dim">Storage</span>
              <span className="mono fs-11">{storage === 'dpapi' ? 'DPAPI' : 'SESSION ONLY'}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() =>
              void window.presenceStudio.widget.openExternal('https://docs.discord.food/resources/widgets')
            }
          >
            <ArrowUpRight size={12} />
            Widget API リファレンス
          </button>
        </aside>
      </div>
    </Modal>
  )
}
