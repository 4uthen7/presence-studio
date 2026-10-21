import {
  Check,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Sparkles,
  Star,
  UserRound,
  Wand2
} from 'lucide-react'
import { Avatar, PageHeader } from '../components/ui'
import { ProfileBadge } from '../lib/badges'
import { useAppStore, useActivePersona } from '../store/appStore'
import { toast, useUiStore } from '../store/uiStore'
import { profileHealth } from '../lib/persona'
import { cn } from '../lib/cn'
import { formatDate } from '../lib/format'
import type { Persona } from '../../../shared/types'

function ProfileCard({ persona, active }: { persona: Persona; active: boolean }): React.JSX.Element {
  const setActivePersona = useAppStore((state) => state.setActivePersona)
  const duplicatePersona = useAppStore((state) => state.duplicatePersona)
  const setPersonaEditor = useUiStore((state) => state.setPersonaEditor)
  const health = profileHealth(persona)

  return (
    <article className={cn('persona-card', active && 'active')}>
      <div
        className="persona-card-banner"
        style={
          persona.banner
            ? { backgroundImage: `url("${persona.banner}")` }
            : { background: `linear-gradient(135deg, #0b0d15, ${persona.accent})` }
        }
      >
        <div className="persona-card-banner-shade" />
        {active && (
          <span className="pill live persona-active-pill">
            <Check size={11} /> ACTIVE
          </span>
        )}
        <div className="persona-card-actions">
          <button
            type="button"
            className="icon-btn sm glass"
            onClick={() => setPersonaEditor(persona.id)}
            aria-label="編集"
            data-tip="編集"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="icon-btn sm glass"
            onClick={() => {
              const next = duplicatePersona(persona.id)
              if (next) toast('success', 'ペルソナを複製しました')
            }}
            aria-label="複製"
            data-tip="複製"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            className="icon-btn sm glass"
            onClick={() => {
              setActivePersona(persona.id)
              toast('success', `${persona.name} をアクティブにしました`)
            }}
            aria-label="アクティブにする"
            data-tip="アクティブにする"
          >
            <Star size={13} />
          </button>
        </div>
      </div>

      <div className="persona-card-body">
        <div className="persona-card-identity">
          <div className="persona-card-avatar">
            <Avatar src={persona.avatar} name={persona.name} size={54} status />
          </div>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="persona-card-name-row">
              <span className="persona-card-name">{persona.name}</span>
              <span className="badge-row">
                {persona.badges.slice(0, 4).map((badge) => (
                  <ProfileBadge key={badge} id={badge} size={15} />
                ))}
              </span>
            </div>
            <div className="persona-card-handle">
              @{persona.handle} {persona.pronouns && <span>· {persona.pronouns}</span>}
            </div>
          </div>
        </div>

        <p className={cn('persona-card-bio', !persona.bio && 'dim')}>{persona.bio || '自己紹介はまだありません。'}</p>

        <div className="persona-card-tags">
          {persona.location && <span className="chip">{persona.location}</span>}
          {persona.links.slice(0, 2).map((link) => (
            <span className="chip" key={link.id}>
              {link.label || link.url}
            </span>
          ))}
          <span className="chip mono">{health.percent}%</span>
        </div>

        <div className="persona-card-foot">
          <span className="dim fs-11">since {formatDate(persona.createdAt)}</span>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPersonaEditor(persona.id)}>
              <Pencil size={11} /> Edit
            </button>
            <button
              type="button"
              className={cn('btn btn-sm', active ? 'btn-ghost' : '')}
              onClick={() => {
                setActivePersona(persona.id)
                toast('success', `${persona.name} をアクティブにしました`)
              }}
            >
              {active ? <Check size={11} /> : <Star size={11} />}
              {active ? 'Active' : 'Use'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ProfilesView(): React.JSX.Element {
  const personas = useAppStore((state) => state.personas)
  const activePersonaId = useAppStore((state) => state.activePersonaId)
  const addPersona = useAppStore((state) => state.addPersona)
  const setActivePersona = useAppStore((state) => state.setActivePersona)
  const updateWidget = useAppStore((state) => state.updateWidget)
  const widget = useAppStore((state) => state.widget)
  const setPersonaEditor = useUiStore((state) => state.setPersonaEditor)
  const setView = useUiStore((state) => state.setView)
  const active = useActivePersona()
  const health = profileHealth(active)
  const activeCount = personas.filter((persona) => persona.id === activePersonaId).length

  const openDiscord = (): void => {
    if (!/^\d{17,20}$/.test(active.userId)) {
      toast('warn', 'Discord User ID が未設定です', 'ペルソナ編集の Identity タブで設定してください。')
      return
    }
    void window.presenceStudio.widget.openExternal(`discord://-/users/${active.userId}`)
  }

  return (
    <div className="view">
      <div className="view-inner">
        <PageHeader
          eyebrow="PROFILES / PERSONAS"
          title={
            <>
              Your <span className="title-accent">personas</span>
            </>
          }
          subtitle="複数のプロフィールを使い分けて、Widget や Presence に流し込みます。"
          actions={
            <>
              <button type="button" className="btn" onClick={() => setPersonaEditor(active.id)}>
                <Pencil size={13} /> Edit active
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const id = addPersona()
                  setPersonaEditor(id)
                }}
              >
                <Plus size={13} /> New persona
              </button>
            </>
          }
        />

        <section className="profile-spotlight panel">
          <div
            className="profile-spotlight-bg"
            style={
              active.banner
                ? { backgroundImage: `url("${active.banner}")` }
                : { background: `linear-gradient(120deg, #0a0c13, ${active.accent}aa)` }
            }
          />
          <div className="profile-spotlight-content">
            <div className="profile-spotlight-main">
              <div className="profile-spotlight-avatar">
                <Avatar src={active.avatar} name={active.name} size={66} status />
              </div>
              <div className="grow">
                <div className="row" style={{ gap: 8 }}>
                  <span className="profile-spotlight-name">{active.name}</span>
                  <span className="badge-row">
                    {active.badges.map((badge) => (
                      <ProfileBadge key={badge} id={badge} size={17} />
                    ))}
                  </span>
                  <span className="pill live">
                    <Check size={10} /> ACTIVE
                  </span>
                </div>
                <div className="profile-spotlight-handle">
                  @{active.handle} · {active.pronouns || 'pronouns not set'} · {active.location || 'location not set'}
                </div>
                <p className="profile-spotlight-bio">{active.bio || '自己紹介はまだありません。'}</p>
                <div className="row" style={{ flexWrap: 'wrap', marginTop: 10 }}>
                  <button type="button" className="btn btn-sm" onClick={() => setPersonaEditor(active.id)}>
                    <Pencil size={11} /> 編集
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={openDiscord}>
                    <ExternalLink size={11} /> Discord で開く
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setView('studio')}>
                    <UserRound size={11} /> Studio で使う
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-spotlight-stats">
              <div className="spotlight-stat">
                <span className="spotlight-stat-label">PERSONAS</span>
                <span className="spotlight-stat-value">{personas.length}</span>
                <span className="spotlight-stat-sub">{activeCount} active</span>
              </div>
              <div className="spotlight-stat">
                <span className="spotlight-stat-label">COMPLETENESS</span>
                <span className="spotlight-stat-value">{health.percent}%</span>
                <div className="mini-bar" style={{ width: 74 }}>
                  <i style={{ width: `${health.percent}%` }} />
                </div>
              </div>
              <div className="spotlight-stat">
                <span className="spotlight-stat-label">WIDGET LINK</span>
                <span className="spotlight-stat-value">{widget.usernameSource === 'persona' ? 'ON' : 'OFF'}</span>
                <span className="spotlight-stat-sub">{widget.usernameSource === 'persona' ? 'persona name' : widget.usernameSource}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="profiles-layout">
          <div className="persona-grid">
            {personas.map((persona) => (
              <ProfileCard key={persona.id} persona={persona} active={persona.id === activePersonaId} />
            ))}
            <button
              type="button"
              className="persona-add-card"
              onClick={() => {
                const id = addPersona()
                setPersonaEditor(id)
              }}
            >
              <span className="persona-add-icon">
                <Plus size={20} />
              </span>
              <span className="persona-add-title">New persona</span>
              <span className="persona-add-sub">別の見た目・人格を追加</span>
            </button>
          </div>

          <aside className="profile-health panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">
                  <Sparkles size={14} /> Profile health
                </div>
                <div className="panel-sub">アクティブペルソナの完成度</div>
              </div>
              <div className="progress-ring" style={{ ['--value' as string]: health.percent }}>
                <span>{health.percent}%</span>
              </div>
            </div>
            <div className="panel-pad stack" style={{ gap: 14 }}>
              <div className="health-list">
                {health.checks.map((check) => (
                  <div key={check.label} className={cn('health-item', check.done && 'done')}>
                    {check.done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                    <span>{check.label}</span>
                    {!check.done && <span className="health-missing">未設定</span>}
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="stack" style={{ gap: 8 }}>
                <div className="toggle-row-title">Widget へのマッピング</div>
                <div className="mapping-row">
                  <span className="dim">username</span>
                  <span className="mono">{widget.usernameSource === 'handle' ? active.handle : active.name}</span>
                </div>
                <div className="mapping-row">
                  <span className="dim">accent</span>
                  <span className="mono row" style={{ gap: 6 }}>
                    <span className="color-dot" style={{ background: active.accent }} />
                    {active.accent.toUpperCase()}
                  </span>
                </div>
                <div className="mapping-row">
                  <span className="dim">avatar</span>
                  <span className="mono">{active.avatar ? 'local image' : 'not set'}</span>
                </div>
              </div>

              <div className="row" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    updateWidget({
                      usernameSource: 'persona',
                      accent: active.accent,
                      customUsername: active.handle
                    })
                    toast('success', 'Widget にペルソナを適用しました', 'accent と username を更新しました。')
                  }}
                >
                  <Wand2 size={12} /> Widget に適用
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setActivePersona(active.id)}
                >
                  <Check size={12} /> 再選択
                </button>
              </div>

              {health.missing.length > 0 ? (
                <div className="callout warn">
                  <Sparkles size={14} />
                  <div>
                    あと <strong>{health.missing.length}</strong> 項目で完成です: {health.missing.join('、')}
                  </div>
                </div>
              ) : (
                <div className="callout">
                  <Sparkles size={14} />
                  <div>プロフィールが完成しています。Widget に反映して配布できます。</div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
