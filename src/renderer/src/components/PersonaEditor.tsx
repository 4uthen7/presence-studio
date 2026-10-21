import { useState } from 'react'
import { Copy, ExternalLink, Plus, Star, Trash2, X } from 'lucide-react'
import { Field, ImageField, Modal } from './ui'
import { ProfilePreview } from './ProfilePreview'
import { useAppStore, useActivePersona } from '../store/appStore'
import { useUiStore, toast } from '../store/uiStore'
import { BADGES } from '../lib/badges'
import { uid } from '../lib/seed'
import { cn } from '../lib/cn'
import type { BadgeId } from '../../../shared/types'

const ACCENTS = ['#8b7cff', '#62e6c4', '#ff7ac8', '#5aa9ff', '#f5c46b', '#ff8a5b', '#b28cff', '#7dd3fc']

export function PersonaEditor(): React.JSX.Element | null {
  const editorId = useUiStore((state) => state.personaEditorId)
  const setEditor = useUiStore((state) => state.setPersonaEditor)
  const personas = useAppStore((state) => state.personas)
  const activePersonaId = useAppStore((state) => state.activePersonaId)
  const presence = useAppStore((state) => state.presence)
  const settings = useAppStore((state) => state.settings)
  const updatePersona = useAppStore((state) => state.updatePersona)
  const toggleBadge = useAppStore((state) => state.toggleBadge)
  const setActivePersona = useAppStore((state) => state.setActivePersona)
  const duplicatePersona = useAppStore((state) => state.duplicatePersona)
  const removePersona = useAppStore((state) => state.removePersona)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState<'identity' | 'badges' | 'links'>('identity')
  const fallback = useActivePersona()
  const persona = personas.find((item) => item.id === editorId) ?? fallback

  if (!editorId) return null

  return (
    <Modal
      open={Boolean(editorId)}
      onClose={() => {
        setConfirmDelete(false)
        setEditor(null)
      }}
      title="Persona editor"
      description="プロフィールの見た目と、Widget に流し込む情報を編集します。"
      size="xl"
      footer={
        <>
          <div className="left row">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const next = duplicatePersona(persona.id)
                if (next) {
                  setEditor(next)
                  toast('success', 'ペルソナを複製しました')
                }
              }}
            >
              <Copy size={13} /> 複製
            </button>
            {personas.length > 1 && (
              <button type="button" className="btn btn-ghost text-danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={13} /> 削除
              </button>
            )}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setActivePersona(persona.id)
              toast('success', `${persona.name} をアクティブにしました`)
            }}
            disabled={persona.id === activePersonaId}
          >
            <Star size={13} /> アクティブにする
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setEditor(null)}>
            完了
          </button>
        </>
      }
    >
      {confirmDelete ? (
        <div className="confirm-panel">
          <div className="confirm-icon">
            <Trash2 size={18} />
          </div>
          <div className="grow">
            <div className="confirm-title">「{persona.name}」を削除しますか？</div>
            <div className="confirm-desc">この操作は取り消せません。プロフィール情報とリンクが削除されます。</div>
          </div>
          <button type="button" className="btn btn-sm" onClick={() => setConfirmDelete(false)}>
            キャンセル
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => {
              removePersona(persona.id)
              setConfirmDelete(false)
              setEditor(null)
              toast('info', 'ペルソナを削除しました')
            }}
          >
            削除する
          </button>
        </div>
      ) : null}

      <div className="persona-editor">
        <div className="persona-form">
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button type="button" className={cn('tab', tab === 'identity' && 'active')} onClick={() => setTab('identity')}>
              アイデンティティ
            </button>
            <button type="button" className={cn('tab', tab === 'badges' && 'active')} onClick={() => setTab('badges')}>
              バッジ
            </button>
            <button type="button" className={cn('tab', tab === 'links' && 'active')} onClick={() => setTab('links')}>
              リンク
            </button>
          </div>

          {tab === 'identity' && (
            <div className="stack" style={{ gap: 15 }}>
              <div className="form-grid two">
                <Field label="表示名" hint={`${persona.name.length}/32`} htmlFor="pe-name">
                  <input
                    id="pe-name"
                    className="input"
                    value={persona.name}
                    maxLength={32}
                    onChange={(event) => updatePersona(persona.id, { name: event.target.value })}
                  />
                </Field>
                <Field label="ハンドル" hint="表示のみ" htmlFor="pe-handle">
                  <div className="input-wrap has-prefix">
                    <span className="input-prefix">@</span>
                    <input
                      id="pe-handle"
                      className="input"
                      value={persona.handle}
                      maxLength={32}
                      onChange={(event) =>
                        updatePersona(persona.id, {
                          handle: event.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase()
                        })
                      }
                    />
                  </div>
                </Field>
              </div>

              <div className="form-grid two">
                <Field label="代名詞" hint="任意" htmlFor="pe-pronouns">
                  <input
                    id="pe-pronouns"
                    className="input"
                    value={persona.pronouns}
                    placeholder="they/them"
                    maxLength={24}
                    onChange={(event) => updatePersona(persona.id, { pronouns: event.target.value })}
                  />
                </Field>
                <Field label="場所" hint="任意" htmlFor="pe-location">
                  <input
                    id="pe-location"
                    className="input"
                    value={persona.location}
                    placeholder="Tokyo, JP"
                    maxLength={40}
                    onChange={(event) => updatePersona(persona.id, { location: event.target.value })}
                  />
                </Field>
              </div>

              <Field
                label="自己紹介"
                hint={`${persona.bio.length}/190`}
                help="Discord の「自己紹介」と同じ雰囲気で。Widget の説明文にも使えます。"
                htmlFor="pe-bio"
              >
                <textarea
                  id="pe-bio"
                  className="textarea"
                  value={persona.bio}
                  maxLength={190}
                  rows={4}
                  onChange={(event) => updatePersona(persona.id, { bio: event.target.value })}
                  placeholder="Building small worlds after midnight…"
                />
              </Field>

              <div className="form-grid two">
                <Field label="アクセントカラー" hint={persona.accent.toUpperCase()}>
                  <div className="color-input">
                    <div className="color-swatch" style={{ background: persona.accent }}>
                      <input
                        type="color"
                        value={persona.accent}
                        onChange={(event) => updatePersona(persona.id, { accent: event.target.value })}
                      />
                    </div>
                    <div className="color-presets">
                      {ACCENTS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn('color-preset', persona.accent === color && 'active')}
                          style={{ background: color }}
                          onClick={() => updatePersona(persona.id, { accent: color })}
                          aria-label={color}
                        />
                      ))}
                    </div>
                  </div>
                </Field>
                <Field label="Discord User ID" hint="任意" help="プロフィールを開くリンクに使用します。" htmlFor="pe-user">
                  <input
                    id="pe-user"
                    className="input mono"
                    value={persona.userId}
                    placeholder="123456789012345678"
                    onChange={(event) =>
                      updatePersona(persona.id, { userId: event.target.value.replace(/[^\d]/g, '').slice(0, 20) })
                    }
                  />
                </Field>
              </div>

              <div className="form-grid two">
                <ImageField
                  label="アバター"
                  value={persona.avatar}
                  onChange={(value) => updatePersona(persona.id, { avatar: value })}
                  maxSize={512}
                  aspect="square"
                  hint="512px"
                />
                <ImageField
                  label="バナー"
                  value={persona.banner}
                  onChange={(value) => updatePersona(persona.id, { banner: value })}
                  maxSize={1400}
                  aspect="wide"
                  hint="1400px"
                />
              </div>
            </div>
          )}

          {tab === 'badges' && (
            <div className="stack">
              <div className="callout">
                <Star size={14} />
                <div>バッジはプロフィールプレビュー用の装飾です。実際の Discord アカウントのバッジは変更されません。</div>
              </div>
              <div className="badge-grid">
                {BADGES.map((badge) => {
                  const active = persona.badges.includes(badge.id)
                  const Icon = badge.Icon
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      className={cn('badge-choice', active && 'active')}
                      onClick={() => toggleBadge(persona.id, badge.id as BadgeId)}
                      style={{ ['--badge-color' as string]: badge.color }}
                    >
                      <span className="badge-choice-icon">
                        <Icon size={16} />
                      </span>
                      <span className="grow">
                        <span className="badge-choice-label">{badge.label}</span>
                        <span className="badge-choice-desc">{badge.description}</span>
                      </span>
                      <span className={cn('badge-choice-check', active && 'on')}>{active ? 'ON' : ''}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'links' && (
            <div className="stack">
              <div className="callout">
                <ExternalLink size={14} />
                <div>プロフィールカードに表示するリンクです。Widget の metadata に流し込むこともできます。</div>
              </div>
              <div className="link-editor">
                {persona.links.length === 0 && <div className="field-table-empty">リンクがありません。</div>}
                {persona.links.map((link) => (
                  <div className="link-editor-row" key={link.id}>
                    <input
                      className="input"
                      value={link.label}
                      placeholder="github"
                      onChange={(event) =>
                        updatePersona(persona.id, {
                          links: persona.links.map((item) =>
                            item.id === link.id ? { ...item, label: event.target.value } : item
                          )
                        })
                      }
                    />
                    <input
                      className="input mono"
                      value={link.url}
                      placeholder="https://…"
                      onChange={(event) =>
                        updatePersona(persona.id, {
                          links: persona.links.map((item) =>
                            item.id === link.id ? { ...item, url: event.target.value } : item
                          )
                        })
                      }
                    />
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() =>
                        updatePersona(persona.id, {
                          links: persona.links.filter((item) => item.id !== link.id)
                        })
                      }
                      aria-label="削除"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={() =>
                  updatePersona(persona.id, {
                    links: [...persona.links, { id: uid(), label: '', url: '' }]
                  })
                }
              >
                <Plus size={12} /> リンクを追加
              </button>
            </div>
          )}
        </div>

        <aside className="persona-preview">
          <ProfilePreview persona={persona} presence={presence} settings={settings} />
        </aside>
      </div>
    </Modal>
  )
}
