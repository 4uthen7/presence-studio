import { Check, CloudOff, Loader2, Radio } from 'lucide-react'
import { useAppStore, useActivePersona } from '../store/appStore'
import { useUiStore } from '../store/uiStore'
import { cn } from '../lib/cn'

export function StatusBar(): React.JSX.Element {
  const status = useUiStore((state) => state.rpcStatus)
  const saveStatus = useUiStore((state) => state.saveStatus)
  const appId = useAppStore((state) => state.settings.appId)
  const presenceEnabled = useAppStore((state) => state.presence.enabled)
  const persona = useActivePersona()

  const dotClass =
    status.state === 'connected' ? 'live' : status.state === 'connecting' ? 'connecting' : status.state === 'error' ? 'error' : ''

  return (
    <footer className="statusbar">
      <div className="status-item">
        <span className={cn('status-dot', dotClass)} />
        <strong>{status.state === 'connected' ? 'Discord IPC connected' : status.state === 'connecting' ? 'Connecting to Discord…' : status.state === 'error' ? 'Discord unavailable' : 'Discord offline'}</strong>
      </div>
      {status.message && status.state !== 'connected' && (
        <div className="status-item status-message" title={status.message}>
          {status.message}
        </div>
      )}
      <div className="status-spacer" />
      <div className="status-item">
        <Radio size={10} />
        {appId ? `APP ${appId}` : 'APP NOT SET'}
      </div>
      <div className="status-item">
        <span className="status-dot" style={{ background: persona.accent }} />
        {persona.name}
      </div>
      <div className="status-item">
        {saveStatus === 'saving' ? (
          <>
            <Loader2 size={10} className="spin" /> 保存中
          </>
        ) : saveStatus === 'saved' ? (
          <>
            <Check size={10} /> 自動保存済み
          </>
        ) : saveStatus === 'error' ? (
          <>
            <CloudOff size={10} /> 保存エラー
          </>
        ) : (
          'AUTOSAVE'
        )}
      </div>
      <div className="status-item">
        <span className={cn('status-dot', presenceEnabled && 'live')} />
        {presenceEnabled ? 'LIVE' : 'IDLE'}
      </div>
      <div className="status-item kbd">Ctrl Shift P</div>
    </footer>
  )
}
