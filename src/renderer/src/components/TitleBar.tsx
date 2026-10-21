import { useEffect, useState } from 'react'
import {
  Cloud,
  CloudOff,
  Copy,
  Minus,
  Search,
  Square,
  Wifi,
  WifiOff,
  X
} from 'lucide-react'
import iconUrl from '../assets/icon-256.png'
import { cn } from '../lib/cn'
import { useUiStore } from '../store/uiStore'
import { useAppStore } from '../store/appStore'

export function TitleBar(): React.JSX.Element {
  const [maximized, setMaximized] = useState(false)
  const [version, setVersion] = useState('0.2.0')
  const rpcStatus = useUiStore((state) => state.rpcStatus)
  const setCommandOpen = useUiStore((state) => state.setCommandOpen)
  const setQuickConnectOpen = useUiStore((state) => state.setQuickConnectOpen)
  const presenceEnabled = useAppStore((state) => state.presence.enabled)
  const appId = useAppStore((state) => state.settings.appId)

  useEffect(() => {
    const unsubscribe = window.presenceStudio.window.onMaximizedChange(setMaximized)
    void window.presenceStudio.system.getInfo().then((info) => setVersion(info.version))
    return unsubscribe
  }, [])

  const statusLabel =
    rpcStatus.state === 'connected'
      ? rpcStatus.user?.username ?? 'Discord'
      : rpcStatus.state === 'connecting'
        ? '接続中'
        : rpcStatus.state === 'error'
          ? '未接続'
          : 'オフライン'

  const statusClass =
    rpcStatus.state === 'connected'
      ? 'live'
      : rpcStatus.state === 'connecting'
        ? 'connecting'
        : rpcStatus.state === 'error'
          ? 'error'
          : ''

  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <img className="brand-mark" src={iconUrl} alt="" draggable={false} />
        <div className="titlebar-brand-copy">
          <span className="titlebar-brand-name">Presence Studio</span>
          <span className="titlebar-brand-version">v{version}</span>
        </div>
      </div>

      <button type="button" className="titlebar-search" onClick={() => setCommandOpen(true)}>
        <Search size={12} />
        <span>検索、移動、アクション…</span>
        <span className="kbd">Ctrl K</span>
      </button>

      <div className="titlebar-actions">
        {presenceEnabled && (
          <span className="pill live" data-tip="Presence is live">
            <span className="dot live" />
            LIVE
          </span>
        )}
        <button
          type="button"
          className={cn('connection-pill', rpcStatus.state)}
          onClick={() => setQuickConnectOpen(true)}
          data-tip={rpcStatus.message ?? (appId ? `Application ${appId}` : 'Application ID を設定')}
        >
          {rpcStatus.state === 'connected' ? (
            <Wifi size={12} />
          ) : rpcStatus.state === 'connecting' ? (
            <Cloud size={12} />
          ) : (
            <WifiOff size={12} />
          )}
          <span className={cn('dot', statusClass)} />
          <span>{statusLabel}</span>
        </button>
        {rpcStatus.state === 'error' && <CloudOff size={12} className="text-danger" />}
      </div>

      <div className="window-controls">
        <button
          type="button"
          className="window-control"
          onClick={() => window.presenceStudio.window.minimize()}
          aria-label="最小化"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          className="window-control"
          onClick={() => window.presenceStudio.window.toggleMaximize()}
          aria-label={maximized ? '元に戻す' : '最大化'}
        >
          {maximized ? <Copy size={12} /> : <Square size={11} />}
        </button>
        <button
          type="button"
          className="window-control close"
          onClick={() => window.presenceStudio.window.close()}
          aria-label="閉じる"
        >
          <X size={15} />
        </button>
      </div>
    </header>
  )
}
