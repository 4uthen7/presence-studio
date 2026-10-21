import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  Blocks,
  Download,
  FolderOpen,
  Gamepad2,
  LayoutDashboard,
  LibraryBig,
  LogIn,
  LogOut,
  Plus,
  Radio,
  Settings2,
  Upload,
  UserRound,
  Users
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'
import { useAppStore, toPersistedState } from '../store/appStore'
import { toast, useUiStore } from '../store/uiStore'
import { goLive, stopLive } from '../lib/live'
import { isDiscordId } from '../lib/format'

interface Command {
  id: string
  group: string
  title: string
  hint?: string
  shortcut?: string
  Icon: LucideIcon
  run: () => void | Promise<void>
  keywords?: string
}

export function CommandPalette(): React.JSX.Element | null {
  const open = useUiStore((state) => state.commandOpen)
  const setOpen = useUiStore((state) => state.setCommandOpen)
  const setView = useUiStore((state) => state.setView)
  const setPublishOpen = useUiStore((state) => state.setPublishOpen)
  const setPersonaEditor = useUiStore((state) => state.setPersonaEditor)
  const setQuickConnectOpen = useUiStore((state) => state.setQuickConnectOpen)
  const personas = useAppStore((state) => state.personas)
  const activePersonaId = useAppStore((state) => state.activePersonaId)
  const presenceEnabled = useAppStore((state) => state.presence.enabled)
  const appId = useAppStore((state) => state.settings.appId)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Command[]>(() => {
    const items: Command[] = [
      {
        id: 'live',
        group: 'アクション',
        title: presenceEnabled ? 'Presence を停止' : 'Presence を開始',
        hint: presenceEnabled ? 'Discord のアクティビティをクリア' : '現在の構成で Go live',
        shortcut: 'Ctrl ↵',
        Icon: presenceEnabled ? LogOut : LogIn,
        run: async () => {
          if (presenceEnabled) await stopLive()
          else await goLive()
        }
      },
      {
        id: 'publish',
        group: 'アクション',
        title: 'Widget を公開',
        hint: 'Widget data を Discord に送信',
        Icon: Radio,
        run: () => setPublishOpen(true)
      },
      {
        id: 'new-persona',
        group: 'アクション',
        title: '新しいペルソナ',
        Icon: Plus,
        run: () => {
          const id = useAppStore.getState().addPersona()
          setPersonaEditor(id)
        }
      },
      {
        id: 'connection',
        group: 'アクション',
        title: 'Discord 接続を設定',
        hint: appId ? `Application ${appId}` : 'Application ID が未設定',
        Icon: Settings2,
        run: () => setQuickConnectOpen(true)
      },
      {
        id: 'export',
        group: 'データ',
        title: 'ワークスペースをエクスポート',
        Icon: Download,
        run: async () => {
          const path = await window.presenceStudio.store.export(toPersistedState(useAppStore.getState()))
          if (path) toast('success', 'エクスポートしました', path)
        }
      },
      {
        id: 'import',
        group: 'データ',
        title: 'ワークスペースをインポート',
        Icon: Upload,
        run: async () => {
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
      },
      {
        id: 'data-folder',
        group: 'データ',
        title: 'データフォルダを開く',
        Icon: FolderOpen,
        run: () => window.presenceStudio.store.openDataFolder()
      },
      {
        id: 'view-studio',
        group: '移動',
        title: 'Studio',
        hint: 'Presence composer',
        shortcut: 'Ctrl 1',
        Icon: LayoutDashboard,
        run: () => setView('studio')
      },
      {
        id: 'view-widgets',
        group: '移動',
        title: 'Widgets',
        hint: 'Widget composer',
        shortcut: 'Ctrl 2',
        Icon: Blocks,
        run: () => setView('widgets')
      },
      {
        id: 'view-presets',
        group: '移動',
        title: 'Presets',
        hint: 'ゲーム・アプリのRPCプリセット',
        shortcut: 'Ctrl 3',
        Icon: Gamepad2,
        run: () => setView('presets')
      },
      {
        id: 'view-profiles',
        group: '移動',
        title: 'Profiles',
        hint: 'ペルソナ管理',
        shortcut: 'Ctrl 4',
        Icon: Users,
        run: () => setView('profiles')
      },
      {
        id: 'view-library',
        group: '移動',
        title: 'Library',
        hint: 'テンプレートとアセット',
        shortcut: 'Ctrl 5',
        Icon: LibraryBig,
        run: () => setView('library')
      },
      {
        id: 'view-settings',
        group: '移動',
        title: 'Settings',
        hint: '接続と外観',
        shortcut: 'Ctrl 6',
        Icon: Settings2,
        run: () => setView('settings')
      }
    ]

    for (const persona of personas) {
      items.push({
        id: `persona-${persona.id}`,
        group: 'ペルソナ',
        title: persona.name,
        hint: persona.id === activePersonaId ? '現在アクティブ' : `@${persona.handle}`,
        Icon: UserRound,
        run: () => {
          useAppStore.getState().setActivePersona(persona.id)
          toast('info', `${persona.name} に切り替えました`)
        }
      })
    }
    return items
  }, [
    activePersonaId,
    appId,
    personas,
    presenceEnabled,
    setPersonaEditor,
    setPublishOpen,
    setQuickConnectOpen,
    setView
  ])

  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return commands
    return commands.filter((command) =>
      `${command.title} ${command.hint ?? ''} ${command.group} ${command.keywords ?? ''}`
        .toLowerCase()
        .includes(clean)
    )
  }, [commands, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setCursor(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setCursor((current) => Math.min(current + 1, filtered.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setCursor((current) => Math.max(current - 1, 0))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const command = filtered[cursor]
        if (command) {
          setOpen(false)
          void command.run()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, cursor, setOpen])

  if (!open) return null

  let lastGroup = ''
  return createPortal(
    <div
      className="command-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false)
      }}
    >
      <div className="command-panel">
        <div className="command-search">
          <span className="command-icon">
            <ArrowRight size={14} />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setCursor(0)
            }}
            placeholder="コマンド、ページ、ペルソナを検索…"
          />
          <span className="kbd">ESC</span>
        </div>
        <div className="command-list">
          {filtered.length === 0 && <div className="command-empty">一致するコマンドがありません</div>}
          {filtered.map((command, index) => {
            const showGroup = command.group !== lastGroup
            lastGroup = command.group
            const Icon = command.Icon
            return (
              <div key={command.id}>
                {showGroup && <div className="command-group">{command.group}</div>}
                <button
                  type="button"
                  className={cn('command-item', index === cursor && 'active')}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => {
                    setOpen(false)
                    void command.run()
                  }}
                >
                  <span className="command-item-icon">
                    <Icon size={15} />
                  </span>
                  <span className="grow">
                    <span className="command-item-title">{command.title}</span>
                    {command.hint && <span className="command-item-hint">{command.hint}</span>}
                  </span>
                  {command.shortcut && <span className="kbd">{command.shortcut}</span>}
                </button>
              </div>
            )
          })}
        </div>
        <div className="command-foot">
          <span>
            <span className="kbd">↑↓</span> 移動
          </span>
          <span>
            <span className="kbd">↵</span> 実行
          </span>
          <span className="grow" />
          {isDiscordId(appId) ? (
            <span className="text-ok">APP READY</span>
          ) : (
            <span className="text-warn">APP ID NOT SET</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
