import type { Persona, WidgetBlock, WidgetConfig } from '../../../shared/types'
import { isHttpUrl } from './format'

export interface WidgetDynamicField {
  type: 1 | 2 | 3
  name: string
  value: string | number | { url: string }
}

export interface WidgetPayload {
  username?: string
  metadata?: Record<string, string>
  data: {
    primary?: Record<string, string | number>
    dynamic?: WidgetDynamicField[]
  }
}

export interface WidgetFieldRow {
  blockId: string
  name: string
  type: 'text' | 'number' | 'image'
  sample: string
  valid: boolean
  reason?: string
}

export interface WidgetBuild {
  payload: WidgetPayload
  fields: WidgetFieldRow[]
  errors: string[]
  warnings: string[]
}

const NAME_PATTERN = /^[a-zA-Z0-9_.-]{1,64}$/

function displayValue(block: WidgetBlock): string {
  if (block.kind === 'stat') return `${block.label || 'STAT'}: ${block.value || '—'}`
  if (block.kind === 'progress') return `${block.value || '0'}%`
  return block.value || '—'
}

export function getWidgetFields(widget: WidgetConfig): WidgetFieldRow[] {
  return widget.blocks
    .filter((block) => block.source === 'dynamic' && block.field.trim())
    .map((block) => {
      const name = block.field.trim()
      const validName = NAME_PATTERN.test(name)
      let valid = validName
      let reason = validName ? undefined : 'Data Field は英数字・_・-・. で指定してください。'

      if (block.valueType === 'image') {
        if (!block.value.trim()) {
          valid = false
          reason = '画像URLが空です。'
        } else if (block.value.startsWith('data:')) {
          valid = false
          reason = 'ローカル画像はDiscordに送信できません。https URLを使ってください。'
        } else if (!isHttpUrl(block.value)) {
          valid = false
          reason = '画像は https URL で指定してください。'
        }
      } else if (block.valueType === 'number') {
        if (!Number.isFinite(Number(block.value.replace(/,/g, '')))) {
          valid = false
          reason = '数値として読み取れません。'
        }
      }

      return {
        blockId: block.id,
        name,
        type: block.valueType,
        sample: displayValue(block),
        valid,
        reason
      }
    })
}

export function buildWidgetPayload(widget: WidgetConfig, persona: Persona): WidgetBuild {
  const errors: string[] = []
  const warnings: string[] = []
  const dynamic: WidgetDynamicField[] = []
  const seen = new Set<string>()
  const fields = getWidgetFields(widget)

  for (const row of fields) {
    if (!row.valid) {
      errors.push(`${row.name}: ${row.reason ?? '値を確認してください。'}`)
      continue
    }
    if (seen.has(row.name)) {
      warnings.push(`Data Field「${row.name}」が重複しています。最初の値を使用します。`)
      continue
    }
    seen.add(row.name)
    const block = widget.blocks.find((item) => item.id === row.blockId)
    if (!block) continue
    if (block.valueType === 'image') {
      dynamic.push({ type: 3, name: row.name, value: { url: block.value.trim() } })
    } else if (block.valueType === 'number') {
      dynamic.push({ type: 2, name: row.name, value: Number(block.value.replace(/,/g, '')) })
    } else {
      dynamic.push({ type: 1, name: row.name, value: block.value })
    }
  }

  if (dynamic.length === 0) {
    warnings.push('Dynamic Data が空です。ウィジェットは更新されますが、表示する値がありません。')
  }

  const metadata: Record<string, string> = {}
  let metaCount = 0
  for (const entry of widget.metadata) {
    const key = entry.key.trim()
    const value = entry.value.trim()
    if (!key && !value) continue
    if (!key || !value) {
      warnings.push('Metadata のキーと値は両方入力してください。')
      continue
    }
    if (!NAME_PATTERN.test(key)) {
      warnings.push(`Metadata キー「${key}」は英数字・_・-・. で指定してください。`)
      continue
    }
    if (metaCount >= 25) {
      errors.push('Metadata は最大25件です。')
      break
    }
    if (key in metadata) {
      warnings.push(`Metadata キー「${key}」が重複しています。`)
    }
    metadata[key] = value
    metaCount += 1
  }

  let username = ''
  if (widget.usernameSource === 'persona') username = persona.name
  else if (widget.usernameSource === 'handle') username = persona.handle
  else username = widget.customUsername
  username = username.trim()
  if (!username) warnings.push('Username が空です。Discord 側の表示名が使われます。')

  const primary: Record<string, string | number> = {}
  const numericKeys = new Set(['playtime_hours', 'total_wins', 'total_games'])
  for (const [key, value] of Object.entries(widget.primary)) {
    const clean = String(value ?? '').trim()
    if (!clean) continue
    if (numericKeys.has(key)) {
      const parsed = Number(clean)
      if (Number.isFinite(parsed)) primary[key] = parsed
      else warnings.push(`Primary「${key}」は数値として読み取れません。`)
    } else {
      primary[key] = clean
    }
  }

  const payload: WidgetPayload = {
    data: {
      dynamic,
      ...(Object.keys(primary).length > 0 ? { primary } : {})
    }
  }
  if (username) payload.username = username
  if (Object.keys(metadata).length > 0) payload.metadata = metadata

  return { payload, fields, errors, warnings }
}

export function legacyWidgetPreviewRows(widget: WidgetConfig): Array<{ label: string; value: string }> {
  return widget.blocks
    .filter((block) => block.source === 'dynamic' && block.value)
    .slice(0, 8)
    .map((block) => ({
      label: block.field || block.kind,
      value: block.value
    }))
}
