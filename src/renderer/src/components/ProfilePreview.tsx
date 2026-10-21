import { CalendarDays, Link2, MapPin, MoreHorizontal } from 'lucide-react'
import type { Persona, PresenceConfig, Settings } from '../../../shared/types'
import { BADGES } from '../lib/badges'
import { formatDate, isHttpUrl } from '../lib/format'
import { makeArtwork } from '../lib/art'
import { ACTIVITY_LABELS } from '../lib/presence'
import { Avatar } from './ui'
import iconUrl from '../assets/icon-256.png'
import { useMemo } from 'react'

export function ProfilePreview({
  persona,
  presence,
  settings
}: {
  persona: Persona
  presence: PresenceConfig
  settings: Settings
}): React.JSX.Element {
  const art = useMemo(
    () => makeArtwork(`${persona.handle}-profile`, persona.accent, '#ff7ac8'),
    [persona.handle, persona.accent]
  )
  const activeBadges = BADGES.filter((badge) => persona.badges.includes(badge.id))
  const activity = ACTIVITY_LABELS[presence.activityType]
  const showActivity = presence.enabled || presence.details || presence.state

  return (
    <div className="profile-preview">
      <div className="preview-topline">
        <span className="preview-label">PROFILE PREVIEW</span>
        <span className="pill mono">POPOUT</span>
      </div>

      <div className="profile-card" style={{ ['--profile-accent' as string]: persona.accent }}>
        <div
          className="profile-banner"
          style={
            persona.banner
              ? { backgroundImage: `url("${persona.banner}")` }
              : { background: `linear-gradient(135deg, #0b0d15, ${persona.accent} 65%, #ff7ac8)` }
          }
        >
          <div className="profile-banner-shade" />
        </div>

        <div className="profile-avatar-row">
          <div className="profile-avatar-ring">
            <Avatar src={persona.avatar} name={persona.name} size={72} />
          </div>
          <button type="button" className="icon-btn sm profile-more" aria-label="メニュー">
            <MoreHorizontal size={16} />
          </button>
        </div>

        <div className="profile-body">
          <div className="profile-name-row">
            <span className="profile-name">{persona.name || 'Unnamed'}</span>
            <span className="badge-row">
              {activeBadges.map((badge) => {
                const Icon = badge.Icon
                return (
                  <span
                    key={badge.id}
                    className="profile-badge"
                    style={{
                      background: `${badge.color}22`,
                      color: badge.color,
                      border: `1px solid ${badge.color}44`,
                      width: 18,
                      height: 18
                    }}
                    title={badge.label}
                  >
                    <Icon size={11} strokeWidth={2.2} />
                  </span>
                )
              })}
            </span>
          </div>
          <div className="profile-handle">
            @{persona.handle || 'handle'}
            {persona.pronouns && <span className="profile-pronouns">· {persona.pronouns}</span>}
          </div>

          <div className="profile-meta-row">
            {persona.location && (
              <span>
                <MapPin size={11} /> {persona.location}
              </span>
            )}
            <span>
              <CalendarDays size={11} /> {formatDate(persona.createdAt)}
            </span>
          </div>

          <div className="profile-divider" />

          <div className="profile-section-label">ABOUT ME</div>
          <p className={persona.bio ? 'profile-bio' : 'profile-bio empty-text'}>
            {persona.bio || 'まだ自己紹介がありません。'}
          </p>

          {persona.links.length > 0 && (
            <div className="profile-links">
              {persona.links.slice(0, 3).map((link) => (
                <span className="profile-link" key={link.id}>
                  <Link2 size={11} />
                  {link.label || link.url}
                </span>
              ))}
            </div>
          )}

          <div className="profile-divider" />

          {showActivity && (
            <div className="profile-activity">
              <div className="profile-activity-art">
                <img
                  src={
                    presence.largeImage &&
                    (presence.largeImage.startsWith('data:') || isHttpUrl(presence.largeImage))
                      ? presence.largeImage
                      : art
                  }
                  alt=""
                />
              </div>
              <div className="grow">
                <div className="profile-activity-kind">{activity.english.toUpperCase()}</div>
                <div className="profile-activity-app">
                  <img src={settings.previewAppIcon || iconUrl} alt="" />
                  {settings.previewAppName || 'Presence Studio'}
                </div>
                <div className="profile-activity-details">{presence.details || 'Details'}</div>
                <div className="profile-activity-state">{presence.state || 'State'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="preview-note">
        プロフィールカードはペルソナの見た目を確認するためのプレビューです。Discord アカウントの情報は変更しません。
      </p>
    </div>
  )
}
