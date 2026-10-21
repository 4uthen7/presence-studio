import { buildActivity } from './presence'
import { isDiscordId } from './format'
import { useAppStore } from '../store/appStore'
import { toast, useUiStore } from '../store/uiStore'

export async function goLive(options: { silent?: boolean } = {}): Promise<boolean> {
  const state = useAppStore.getState()
  const ui = useUiStore.getState()
  if (ui.goLiveBusy) return false

  const appId = state.settings.appId.trim()
  if (!appId) {
    ui.setQuickConnectOpen(true)
    toast('warn', 'Application ID が必要です', 'Discord Developer Portal でアプリを作成し、IDを設定してください。')
    return false
  }
  if (!isDiscordId(appId)) {
    ui.setQuickConnectOpen(true)
    toast('error', 'Application ID の形式が違います', '17〜20桁の数字を入力してください。')
    return false
  }

  const persona = state.personas.find((item) => item.id === state.activePersonaId) ?? state.personas[0]
  const build = buildActivity(state.presence, persona)
  if (!build.activity) {
    toast('error', 'Presence を開始できません', build.errors[0] ?? '入力内容を確認してください。')
    return false
  }

  ui.setGoLiveBusy(true)
  try {
    const status = await window.presenceStudio.rpc.setActivity(appId, build.activity)
    ui.setRpcStatus(status)
    if (status.state === 'connected') {
      state.updatePresence({ enabled: true })
      if (!options.silent) {
        toast('success', 'Presence is live', `${persona.name} として Discord に接続しました。`)
      }
      if (build.warnings.length > 0 && !options.silent) {
        toast('info', 'ヒント', build.warnings[0])
      }
      return true
    }
    state.updatePresence({ enabled: false })
    toast('error', 'Discord に接続できません', status.message ?? 'Discord デスクトップアプリが起動しているか確認してください。')
    return false
  } catch (error) {
    state.updatePresence({ enabled: false })
    toast('error', 'Presence を開始できません', error instanceof Error ? error.message : undefined)
    return false
  } finally {
    ui.setGoLiveBusy(false)
  }
}

export async function stopLive(options: { silent?: boolean } = {}): Promise<void> {
  const state = useAppStore.getState()
  state.updatePresence({ enabled: false })
  try {
    await window.presenceStudio.rpc.clear()
  } catch {
    // Clearing is best-effort.
  }
  if (!options.silent) toast('info', 'Presence を停止しました')
}

export async function toggleLive(): Promise<void> {
  if (useAppStore.getState().presence.enabled) await stopLive()
  else await goLive()
}

export async function pushPresenceSilently(): Promise<void> {
  const state = useAppStore.getState()
  const appId = state.settings.appId.trim()
  if (!appId || !state.presence.enabled) return
  const persona = state.personas.find((item) => item.id === state.activePersonaId) ?? state.personas[0]
  const build = buildActivity(state.presence, persona)
  if (!build.activity) return
  try {
    const status = await window.presenceStudio.rpc.setActivity(appId, build.activity)
    useUiStore.getState().setRpcStatus(status)
  } catch {
    // Status events handle the UI.
  }
}
