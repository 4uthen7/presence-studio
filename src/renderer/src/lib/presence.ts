import type { ActivityType, Persona, PresenceConfig, RpcActivity } from '../../../shared/types'
import { isHttpUrl } from './format'

const ACTIVITY_TYPES: Record<ActivityType, number> = {
  playing: 0,
  listening: 2,
  watching: 3,
  competing: 5
}

export interface PresenceBuild {
  activity: RpcActivity | null
  errors: string[]
  warnings: string[]
}

export function buildActivity(presence: PresenceConfig, persona: Persona): PresenceBuild {
  const errors: string[] = []
  const warnings: string[] = []
  const enabled = (kind: string): boolean =>
    presence.blocks.some((block) => block.kind === kind && block.enabled)

  const activity: RpcActivity = {
    type: ACTIVITY_TYPES[presence.activityType] ?? 0,
    instance: false
  }

  if (enabled('details') && presence.details.trim()) {
    if (presence.details.trim().length === 1) errors.push('Details は2文字以上で入力してください。')
    if (presence.details.length > 128) warnings.push('Details は128文字に切り詰められます。')
    activity.details = presence.details.slice(0, 128)
  }
  if (enabled('state') && presence.state.trim()) {
    if (presence.state.trim().length === 1) errors.push('State は2文字以上で入力してください。')
    if (presence.state.length > 128) warnings.push('State は128文字に切り詰められます。')
    activity.state = presence.state.slice(0, 128)
  }

  if (enabled('largeImage') && presence.largeImage.trim()) {
    if (presence.largeImage.startsWith('data:')) {
      errors.push('ラージ画像にローカル画像は送信できません。Asset Key か https URL を指定してください。')
    } else if (presence.largeImageMode === 'url' && !isHttpUrl(presence.largeImage)) {
      errors.push('ラージ画像のURLは https:// から始めてください。')
    } else {
      activity.largeImageKey = presence.largeImage.trim()
      if (presence.largeImageText.trim()) activity.largeImageText = presence.largeImageText.slice(0, 128)
    }
  }

  if (enabled('smallImage') && presence.smallImage.trim()) {
    if (presence.smallImage.startsWith('data:')) {
      errors.push('スモール画像にローカル画像は送信できません。Asset Key か https URL を指定してください。')
    } else if (presence.smallImageMode === 'url' && !isHttpUrl(presence.smallImage)) {
      errors.push('スモール画像のURLは https:// から始めてください。')
    } else {
      activity.smallImageKey = presence.smallImage.trim()
      if (presence.smallImageText.trim()) activity.smallImageText = presence.smallImageText.slice(0, 128)
    }
  }

  if (enabled('timestamp') && presence.timestampMode !== 'none') {
    if (presence.timestampMode === 'elapsed') {
      const start = new Date(presence.startISO).getTime()
      if (Number.isFinite(start)) activity.startTimestamp = start
    } else {
      const end = new Date(presence.endISO).getTime()
      if (Number.isFinite(end)) activity.endTimestamp = end
    }
  }

  if (enabled('party') && presence.partyEnabled) {
    const current = Number(presence.partyCurrent)
    const max = Number(presence.partyMax)
    if (!Number.isFinite(current) || !Number.isFinite(max) || current < 0 || max < 1) {
      errors.push('パーティの人数を確認してください。')
    } else if (current > max) {
      errors.push('パーティの現在人数が最大人数を超えています。')
    } else {
      activity.partyId = presence.partyId.trim() || `presence-studio-${persona.id}`
      activity.partySize = Math.floor(current)
      activity.partyMax = Math.floor(max)
    }
  }

  if (enabled('buttons')) {
    const buttons = presence.buttons
      .filter((button) => button.label.trim() && button.url.trim())
      .slice(0, 2)
    if (buttons.length === 0) {
      warnings.push('ボタンブロックが有効ですが、リンクが設定されていません。')
    }
    for (const button of buttons) {
      if (!isHttpUrl(button.url)) {
        errors.push(`ボタン「${button.label}」のURLが正しくありません（https:// から始めてください）。`)
      }
      if (button.url.length > 512) errors.push('ボタンのURLは512文字以内にしてください。')
      if (button.label.length > 32) warnings.push('ボタンのラベルは32文字までです。')
    }
    const valid = buttons
      .filter((button) => isHttpUrl(button.url))
      .map((button) => ({ label: button.label.slice(0, 32), url: button.url }))
    if (valid.length > 0) activity.buttons = valid
  }

  if (enabled('statusDisplay')) {
    activity.statusDisplayType = presence.statusDisplay
  }

  if (!activity.details && !activity.state && !activity.largeImageKey && !activity.smallImageKey) {
    errors.push('少なくとも1つのテキストか画像ブロックに内容を入れてください。')
  }

  return {
    activity: errors.length > 0 ? null : activity,
    errors,
    warnings
  }
}

export const ACTIVITY_LABELS: Record<ActivityType, { label: string; english: string; verb: string }> = {
  playing: { label: 'プレイ中', english: 'Playing', verb: 'Playing' },
  listening: { label: '再生中', english: 'Listening', verb: 'Listening to' },
  watching: { label: '視聴中', english: 'Watching', verb: 'Watching' },
  competing: { label: '対戦中', english: 'Competing', verb: 'Competing in' }
}
