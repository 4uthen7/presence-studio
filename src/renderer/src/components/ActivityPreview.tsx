import { useMemo } from 'react'
import {
  ArrowUpRight,
  Clock3,
  Gamepad2,
  MoreHorizontal,
  Music2,
  Trophy,
  Tv,
  Users
} from 'lucide-react'
import type { Persona, PresenceConfig, Settings } from '../../../shared/types'
import { ACTIVITY_LABELS } from '../lib/presence'
import { formatCountdown, formatElapsed, isHttpUrl } from '../lib/format'
import { makeArtwork } from '../lib/art'
import { useNow } from '../lib/hooks'
import { cn } from '../lib/cn'
import { Avatar } from './ui'
import iconUrl from '../assets/icon-256.png'

export function ActivityPreview({
  persona,
  presence,
  settings,
  live,
  appIcon
}: {
  persona: Persona
  presence: PresenceConfig
  settings: Settings
  live: boolean
  appIcon?: string
}): React.JSX.Element {
  const now = useNow(1000)
  const activity = ACTIVITY_LABELS[presence.activityType]
  const FallbackIcon =
    presence.activityType === 'listening'
      ? Music2
      : presence.activityType === 'watching'
        ? Tv
        : presence.activityType === 'competing'
          ? Trophy
          : Gamepad2
  const enabled = (kind: string): boolean =>
    presence.blocks.some((block) => block.kind === kind && block.enabled)
  const hasLarge = enabled('largeImage')
  const hasSmall = enabled('smallImage')
  const renderableImage = (value: string): boolean => value.startsWith('data:') || isHttpUrl(value)
  const art = useMemo(
    () =>
      presence.largeImage && renderableImage(presence.largeImage)
        ? presence.largeImage
        : makeArtwork(`${persona.handle}-${settings.previewAppName}`, persona.accent, '#ff7ac8'),
    [persona.handle, persona.accent, presence.largeImage, settings.previewAppName]
  )
  const smallImageRenderable = renderableImage(presence.smallImage)

  const timestampChip = (() => {
    if (!enabled('timestamp') || presence.timestampMode === 'none') return null
    if (presence.timestampMode === 'elapsed') {
      return `経過 ${formatElapsed(presence.startISO, now)}`
    }
    return `残り ${formatCountdown(presence.endISO, now)}`
  })()

  const partyCurrent = Math.max(0, Number(presence.partyCurrent) || 0)
  const partyMax = Math.max(1, Number(presence.partyMax) || 1)
  const showParty = enabled('party') && presence.partyEnabled
  const showButtons = enabled('buttons') && presence.buttons.some((button) => button.label || button.url)

  return (
    <div className="activity-preview">
      <div className="preview-topline">
        <span className="preview-label">ACTIVITY PREVIEW</span>
        <span className={cn('pill', live ? 'live' : '')}>
          <span className={cn('dot', live && 'live')} />
          {live ? 'LIVE' : 'OFF AIR'}
        </span>
      </div>

      <div className="activity-card">
        <div className="activity-person">
          <Avatar src={persona.avatar} name={persona.name} size={38} status />
          <div className="grow">
            <div className="activity-person-name">{persona.name}</div>
            <div className="activity-person-handle">@{persona.handle}</div>
          </div>
          <button type="button" className="icon-btn sm" aria-label="メニュー">
            <MoreHorizontal size={15} />
          </button>
        </div>

        <div className="activity-approw">
          <img src={appIcon || settings.previewAppIcon || iconUrl} alt="" className="activity-app-icon" />
          <span className="activity-app-name">{settings.previewAppName || 'Your application'}</span>
          <span className="activity-kind">{activity.english.toUpperCase()}</span>
        </div>

        <div className="activity-body">
          {presence.blocks
            .filter((block) => block.enabled)
            .map((block) => {
              switch (block.kind) {
                case 'largeImage':
                  return (
                    <div className="activity-art" key={block.id}>
                      <img src={art} alt="" draggable={false} />
                      <div className="activity-art-shade" />
                      <div className="activity-art-top">
                        {hasSmall && (
                          <div className="activity-small-badge">
                            {presence.smallImage && smallImageRenderable ? (
                              <img src={presence.smallImage} alt="" />
                            ) : (
                              <FallbackIcon size={13} />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="activity-art-caption">
                        <span>{presence.largeImageText || 'Artwork'}</span>
                        {hasSmall && presence.smallImageText && <em>{presence.smallImageText}</em>}
                      </div>
                    </div>
                  )
                case 'smallImage':
                  return hasLarge ? null : (
                    <div className="activity-small-inline" key={block.id}>
                      <span className="activity-small-badge static">
                        {presence.smallImage && smallImageRenderable ? (
                          <img src={presence.smallImage} alt="" />
                        ) : (
                          <FallbackIcon size={13} />
                        )}
                      </span>
                      <span>{presence.smallImageText || 'Small image'}</span>
                    </div>
                  )
                case 'details':
                  return (
                    <div className="activity-details" key={block.id}>
                      {presence.details || 'Details を入力してください'}
                    </div>
                  )
                case 'state':
                  return (
                    <div className="activity-state" key={block.id}>
                      {presence.state || 'State を入力してください'}
                    </div>
                  )
                case 'timestamp':
                  return timestampChip ? (
                    <div className="activity-chip" key={block.id}>
                      <Clock3 size={12} />
                      <span>{timestampChip}</span>
                    </div>
                  ) : null
                case 'party':
                  return showParty ? (
                    <div className="activity-party" key={block.id}>
                      <Users size={12} />
                      <div className="party-dots">
                        {Array.from({ length: Math.min(partyMax, 6) }).map((_, index) => (
                          <span key={index} className={index < partyCurrent ? 'filled' : ''} />
                        ))}
                      </div>
                      <span>
                        {partyCurrent} / {partyMax}
                      </span>
                    </div>
                  ) : null
                case 'buttons':
                  return showButtons ? (
                    <div className="activity-buttons" key={block.id}>
                      {presence.buttons
                        .filter((button) => button.label.trim() && button.url.trim())
                        .slice(0, 2)
                        .map((button) => (
                          <span className="activity-button" key={button.id}>
                            <span>{button.label}</span>
                            <ArrowUpRight size={13} />
                          </span>
                        ))}
                    </div>
                  ) : null
                default:
                  return null
              }
            })}
        </div>

        <div className="activity-footer">
          <span>Rich Presence · {activity.label}</span>
          <span className="mono">{settings.appId ? `APP ${settings.appId.slice(0, 8)}` : 'NO APP ID'}</span>
        </div>
      </div>

      <p className="preview-note">
        プレビュー内のアプリ名は装飾です。Discord には Developer Portal のアプリ名が表示されます。
      </p>
    </div>
  )
}
