import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import { cn } from '../lib/cn'

const ICONS = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warn: AlertTriangle
} as const

export function Toasts(): React.JSX.Element {
  const toasts = useUiStore((state) => state.toasts)
  const dismiss = useUiStore((state) => state.dismissToast)

  return (
    <div className="toast-stack">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind]
        return (
          <div key={toast.id} className={cn('toast', toast.kind)} onClick={() => dismiss(toast.id)}>
            <div className="toast-icon">
              <Icon size={14} />
            </div>
            <div className="grow">
              <div className="toast-title">{toast.title}</div>
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
