import type { Persona } from '../../../shared/types'

export interface ProfileHealth {
  percent: number
  missing: string[]
  checks: Array<{ label: string; done: boolean }>
}

export function profileHealth(persona: Persona): ProfileHealth {
  const checks = [
    { label: '表示名', done: Boolean(persona.name.trim()) },
    { label: 'ハンドル', done: Boolean(persona.handle.trim()) },
    { label: '自己紹介', done: persona.bio.trim().length >= 24 },
    { label: 'アバター', done: Boolean(persona.avatar) },
    { label: 'バナー', done: Boolean(persona.banner) },
    { label: 'リンク', done: persona.links.some((link) => link.url.trim()) },
    { label: 'バッジ', done: persona.badges.length > 0 },
    { label: 'Discord User ID', done: /^\d{17,20}$/.test(persona.userId) }
  ]
  const done = checks.filter((check) => check.done).length
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((check) => !check.done).map((check) => check.label),
    checks
  }
}
