import { BadgeCheck, Bug, Compass, Flame, Gem, Rocket, Sparkles, Terminal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BadgeId } from '../../../shared/types'

export interface BadgeDefinition {
  id: BadgeId
  label: string
  description: string
  color: string
  Icon: LucideIcon
}

export const BADGES: BadgeDefinition[] = [
  { id: 'nitro', label: 'Nitro', description: 'Nitro subscriber', color: '#ff7ac8', Icon: Gem },
  { id: 'boost', label: 'Server Boost', description: 'Boosting a server', color: '#ff8ac8', Icon: Rocket },
  { id: 'early', label: 'Early Supporter', description: 'Early supporter', color: '#f5c46b', Icon: Sparkles },
  { id: 'dev', label: 'Active Developer', description: 'Active developer', color: '#62e6c4', Icon: Terminal },
  { id: 'verified', label: 'Verified', description: 'Verified identity', color: '#5aa9ff', Icon: BadgeCheck },
  { id: 'hypesquad', label: 'HypeSquad', description: 'HypeSquad member', color: '#ff9f6b', Icon: Flame },
  { id: 'quest', label: 'Quest', description: 'Quest completed', color: '#b28cff', Icon: Compass },
  { id: 'bug', label: 'Bug Hunter', description: 'Bug hunter', color: '#ff6b81', Icon: Bug }
]

export const BADGE_MAP = Object.fromEntries(BADGES.map((badge) => [badge.id, badge])) as Record<
  BadgeId,
  BadgeDefinition
>

export function ProfileBadge({ id, size = 17 }: { id: BadgeId; size?: number }): React.JSX.Element {
  const badge = BADGE_MAP[id]
  if (!badge) return <span />
  const Icon = badge.Icon
  return (
    <span
      className="profile-badge"
      style={{
        width: size,
        height: size,
        background: `${badge.color}22`,
        color: badge.color,
        border: `1px solid ${badge.color}44`
      }}
      title={badge.label}
    >
      <Icon size={size * 0.62} strokeWidth={2.2} />
    </span>
  )
}
