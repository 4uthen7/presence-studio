import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Loader2, PlugZap, Unplug, Wifi, WifiOff } from 'lucide-react'
import { Field, Modal, Switch } from './ui'
import { useAppStore } from '../store/appStore'
import { toast, useUiStore } from '../store/uiStore'
import { isDiscordId } from '../lib/format'
import { cn } from '../lib/cn'

export function QuickConnectModal(): React.JSX.Element | null {
  const open = useUiStore((state) => state.quickConnectOpen)
  const setOpen = useUiStore((state) => state.setQuickConnectOpen)
  const status = useUiStore((state) => state.rpcStatus)
  const setRpcStatus = useUiStore((state) => state.setRpcStatus)
  const appId = useAppStore((state) => state.settings.appId)
  const previewAppName = useAppStore((state) => state.settings.previewAppName)
  const autoConnect = useAppStore((state) => state.settings.autoConnect)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const updatePresence = useAppStore((state) => state.updatePresence)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) setBusy(false)
  }, [open])

  const connect = async (): Promise<void> => {
    if (!isDiscordId(appId)) {
      toast('error', 'Application ID を確認してください', '17〜20桁の数字です。')
      return
    }
    setBusy(true)
    try {
      const next = await window.presenceStudio.rpc.connect(appId)
      setRpcStatus(next)
      if (next.state === 'connected') {
        toast('success', 'Discord に接続しました', next.user?.username ? `${next.user.username} として接続` : undefined)
      } else {
        toast('error', '接続できませんでした', next.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async (): Promise<void> => {
    setBusy(true)
    try {
      await window.presenceStudio.rpc.disconnect()
      updatePresence({ enabled: false })
      setRpcStatus({ state: 'disconnected' })
      toast('info', 'Discord から切断しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Discord connection"
      description="Application ID を使ってデスクトップクライアントに接続します。"
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost left"
            onClick={() =>
              void window.presenceStudio.widget.openExternal('https://discord.com/developers/applications')
            }
          >
            <ExternalLink size={13} />
            Developer Portal
          </button>
          {status.state === 'connected' ? (
            <button type="button" className="btn btn-danger" onClick={disconnect} disabled={busy}>
              {busy ? <Loader2 size={13} className="spin" /> : <Unplug size={13} />}
              切断
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={connect} disabled={busy}>
              {busy ? <Loader2 size={13} className="spin" /> : <PlugZap size={13} />}
              接続する
            </button>
          )}
        </>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        <div className={cn('connection-status', status.state)}>
          <div className="connection-status-icon">
            {status.state === 'connected' ? <Wifi size={18} /> : status.state === 'connecting' || busy ? <Loader2 size={18} className="spin" /> : <WifiOff size={18} />}
          </div>
          <div className="grow">
            <div className="connection-status-title">
              {status.state === 'connected'
                ? 'Discord に接続中'
                : status.state === 'connecting' || busy
                  ? 'Discord を探しています…'
                  : status.state === 'error'
                    ? '接続できませんでした'
                    : '未接続'}
            </div>
            <div className="connection-status-sub">
              {status.state === 'connected'
                ? `${status.user?.username ?? 'Discord user'} · Application ${status.appId ?? appId}`
                : status.message ?? 'Discord デスクトップアプリを起動してから接続してください。'}
            </div>
          </div>
          {status.state === 'connected' && (
            <span className="pill live">
              <CheckCircle2 size={11} /> READY
            </span>
          )}
        </div>

        <Field
          label="Application ID"
          hint={appId ? `${appId.length} digits` : '必須'}
          help="Discord Developer Portal → Applications → 対象アプリ → General Information の Application ID。"
          error={appId && !isDiscordId(appId) ? '17〜20桁の数字で入力してください。' : null}
          htmlFor="qc-app-id"
        >
          <input
            id="qc-app-id"
            className="input mono"
            value={appId}
            placeholder="123456789012345678"
            onChange={(event) => updateSettings({ appId: event.target.value.replace(/[^\d]/g, '').slice(0, 20) })}
          />
        </Field>

        <Field
          label="プレビュー用アプリ名"
          hint="表示のみ"
          help="Discord には Developer Portal で設定したアプリ名が表示されます。ここではプレビューのラベルだけを変更します。"
          htmlFor="qc-preview-name"
        >
          <input
            id="qc-preview-name"
            className="input"
            value={previewAppName}
            onChange={(event) => updateSettings({ previewAppName: event.target.value.slice(0, 60) })}
            placeholder="Midnight Drive"
          />
        </Field>

        <div className="toggle-row">
          <div className="toggle-row-copy">
            <div className="toggle-row-title">起動時に自動接続</div>
            <div className="toggle-row-desc">アプリを開いたとき、保存済みの Application ID で Discord に接続します。</div>
          </div>
          <Switch checked={autoConnect} onChange={(value) => updateSettings({ autoConnect: value })} />
        </div>

        <div className="callout">
          <Wifi size={14} />
          <div>
            Rich Presence は Discord デスクトップアプリの IPC を使用します。ブラウザ版 Discord では動作しません。
          </div>
        </div>
      </div>
    </Modal>
  )
}
