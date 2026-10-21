import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Copy, ImagePlus, Loader2, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { toast } from '../store/uiStore'

export function Switch({
  checked,
  onChange,
  disabled
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn('switch', checked && 'on')}
      onClick={() => onChange(!checked)}
    />
  )
}

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
  icon?: ReactNode
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  full,
  tiny,
  className
}: {
  options: Array<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  full?: boolean
  tiny?: boolean
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('segmented', full && 'full', tiny && 'tiny', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Field({
  label,
  hint,
  help,
  error,
  children,
  htmlFor
}: {
  label: string
  hint?: ReactNode
  help?: ReactNode
  error?: string | null
  children: ReactNode
  htmlFor?: string
}): React.JSX.Element {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        <span>{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </label>
      {children}
      {error ? <span className="field-help text-danger">{error}</span> : help ? <span className="field-help">{help}</span> : null}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  accent
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  accent?: ReactNode
}): React.JSX.Element {
  return (
    <header className="page-head">
      <div className="page-head-copy">
        {eyebrow && (
          <div className="eyebrow">
            {accent ?? <span className="eyebrow-dot" />}
            {eyebrow}
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </header>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size,
  className
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'lg' | 'xl'
  className?: string
}): React.JSX.Element | null {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={cn('modal', size === 'lg' && 'lg', size === 'xl' && 'xl', className)} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            {description && <div className="modal-desc">{description}</div>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">
            <X size={15} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export function EmptyState({
  icon,
  title,
  text,
  action
}: {
  icon: ReactNode
  title: string
  text: string
  action?: ReactNode
}): React.JSX.Element {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-text">{text}</div>
      {action}
    </div>
  )
}

export function CopyButton({
  value,
  label = 'コピー',
  className,
  onCopied
}: {
  value: string
  label?: string
  className?: string
  onCopied?: () => void
}): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={cn('btn btn-sm', className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          onCopied?.()
          window.setTimeout(() => setCopied(false), 1600)
        } catch {
          toast('error', 'コピーできませんでした', 'クリップボードへのアクセスが拒否されました。')
        }
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'コピー済み' : label}
    </button>
  )
}

export function Avatar({
  src,
  name,
  size = 40,
  className,
  status
}: {
  src?: string
  name: string
  size?: number
  className?: string
  status?: boolean
}): React.JSX.Element {
  const fallback = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      className={cn('avatar', className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }}
    >
      {src ? (
        <img src={src} alt={name} draggable={false} />
      ) : (
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #8b7cff, #ff7ac8)',
            color: '#fff',
            fontWeight: 650
          }}
        >
          {fallback}
        </span>
      )}
      {status && <span className="status-badge" />}
    </span>
  )
}

export function ImageField({
  label,
  value,
  onChange,
  aspect = 'square',
  hint,
  maxSize = 1024,
  allowUrl = true,
  placeholder = 'https://…'
}: {
  label: string
  value: string
  onChange: (value: string) => void
  aspect?: 'square' | 'wide'
  hint?: string
  maxSize?: number
  allowUrl?: boolean
  placeholder?: string
}): React.JSX.Element {
  const [busy, setBusy] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const readAsResized = (dataUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * ratio))
        const height = Math.max(1, Math.round(image.height * ratio))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('画像を処理できませんでした。'))
          return
        }
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/webp', 0.9))
      }
      image.onerror = () => reject(new Error('画像を読み込めませんでした。'))
      image.src = dataUrl
    })

  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      <div className={cn('image-field', aspect === 'wide' && 'wide')}>
        <div className="image-field-preview">
          {value ? (
            <img src={value} alt="" draggable={false} />
          ) : (
            <div className="image-field-empty">
              <ImagePlus size={18} />
              <span>No image</span>
            </div>
          )}
        </div>
        <div className="image-field-body">
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-sm"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? <Loader2 size={12} className="spin" /> : <ImagePlus size={12} />}
              画像を選択
            </button>
            {allowUrl && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowUrl((next) => !next)}>
                URL
              </button>
            )}
            {value && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')}>
                削除
              </button>
            )}
          </div>
          {showUrl && (
            <input
              className="input mono"
              value={value.startsWith('data:') ? '' : value}
              placeholder={placeholder}
              onChange={(event) => onChange(event.target.value)}
            />
          )}
          {value.startsWith('data:') && (
            <span className="field-help">ローカル画像はプレビュー専用です。Discordへは送信できません。</span>
          )}
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          setBusy(true)
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(String(reader.result))
              reader.onerror = () => reject(new Error('画像を読み込めませんでした。'))
              reader.readAsDataURL(file)
            })
            onChange(await readAsResized(dataUrl))
          } catch (error) {
            toast('error', '画像を読み込めませんでした', error instanceof Error ? error.message : undefined)
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}
