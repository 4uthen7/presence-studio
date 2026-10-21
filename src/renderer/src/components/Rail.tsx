import { Blocks, Gamepad2, LayoutDashboard, LibraryBig, Settings2, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ViewId } from '../../../shared/types'
import { cn } from '../lib/cn'
import { useAppStore, useActivePersona } from '../store/appStore'
import { useUiStore } from '../store/uiStore'
import { Avatar } from './ui'

const NAV: Array<{ id: ViewId; label: string; Icon: LucideIcon }> = [
  { id: 'studio', label: 'Studio', Icon: LayoutDashboard },
  { id: 'widgets', label: 'Widgets', Icon: Blocks },
  { id: 'presets', label: 'Presets', Icon: Gamepad2 },
  { id: 'profiles', label: 'Profiles', Icon: Users },
  { id: 'library', label: 'Library', Icon: LibraryBig },
  { id: 'settings', label: 'Settings', Icon: Settings2 }
]

export function Rail(): React.JSX.Element {
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)
  const presence = useAppStore((state) => state.presence)
  const widgetBlocks = useAppStore((state) => state.widget.blocks.length)
  const personas = useAppStore((state) => state.personas)
  const persona = useActivePersona()

  return (
    <nav className="rail">
      <div className="rail-nav">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            data-view={id}
            className={cn('rail-item', view === id && 'active')}
            onClick={() => setView(id)}
            data-tip={label}
          >
            <span className="rail-icon">
              <Icon size={18} strokeWidth={view === id ? 2.2 : 1.8} />
            </span>
            <span className="rail-label">{label}</span>
            {id === 'widgets' && widgetBlocks > 0 && <span className="rail-count">{widgetBlocks}</span>}
            {id === 'profiles' && personas.length > 0 && <span className="rail-count">{personas.length}</span>}
          </button>
        ))}
      </div>

      <div className="rail-spacer" />

      {presence.enabled && (
        <div className="rail-live">
          <span className="dot live" />
          <span>LIVE</span>
        </div>
      )}
      <button
        type="button"
        className="tooltip rail-avatar-btn"
        data-tip={`${persona.name} · Profiles`}
        onClick={() => setView('profiles')}
      >
        <Avatar src={persona.avatar} name={persona.name} size={36} status />
      </button>
    </nav>
  )
}
