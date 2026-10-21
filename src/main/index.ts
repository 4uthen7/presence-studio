import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
  Notification,
  screen,
  shell,
  Tray
} from 'electron'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import type {
  AppState,
  PublishRequest,
  PublishResponse,
  RpcActivity,
  RpcStatus,
  ViewId
} from '../shared/types'
import { RpcManager } from './rpc'
import {
  clearBotToken,
  exportState,
  importState,
  loadState,
  openDataFolder,
  pickImage,
  readBotToken,
  readWindowBounds,
  resetData,
  saveBotToken,
  saveState,
  saveWindowBounds,
  tokenStatus
} from './store'

const APP_NAME = 'Presence Studio'
const DEV_URL = process.env['ELECTRON_RENDERER_URL']
const isDev = Boolean(DEV_URL)

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let trayHintShown = false
let currentState: AppState | null = null

const runtime = {
  minimizeToTray: true,
  hotkeyEnabled: true
}

const rpc = new RpcManager()

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.setAppUserModelId('studio.presence.app')
app.setName(APP_NAME)
nativeTheme.themeSource = 'dark'

function iconPath(file = 'icon.png'): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, file)
    : path.join(process.cwd(), 'resources', file)
}

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }
}

function sendToRenderer(channel: string, payload?: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function clampBounds(bounds: { x?: number; y?: number; width: number; height: number }): {
  width: number
  height: number
  x?: number
  y?: number
} {
  const width = Math.max(1120, Math.min(bounds.width || 1440, 2400))
  const height = Math.max(720, Math.min(bounds.height || 900, 1600))
  if (bounds.x === undefined || bounds.y === undefined) return { width, height }
  const display = screen.getDisplayMatching({ x: bounds.x, y: bounds.y, width, height })
  const area = display.workArea
  const x = Math.min(Math.max(bounds.x, area.x - width + 120), area.x + area.width - 120)
  const y = Math.min(Math.max(bounds.y, area.y - 20), area.y + area.height - 120)
  return { width, height, x, y }
}

async function createWindow(): Promise<void> {
  const saved = await readWindowBounds()
  const bounds = clampBounds(saved ?? { width: 1440, height: 900 })

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#08090d',
    title: APP_NAME,
    icon: iconPath(),
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  })

  if (saved?.maximized) mainWindow.maximize()

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('maximize', () => sendToRenderer('window:maximized', true))
  mainWindow.on('unmaximize', () => sendToRenderer('window:maximized', false))
  mainWindow.webContents.once('did-finish-load', () => {
    sendToRenderer('window:maximized', Boolean(mainWindow?.isMaximized()))
  })

  mainWindow.on('close', (event) => {
    if (isQuitting) return
    if (runtime.minimizeToTray) {
      event.preventDefault()
      mainWindow?.hide()
      if (!trayHintShown && Notification.isSupported()) {
        trayHintShown = true
        new Notification({
          title: `${APP_NAME} is still running`,
          body: 'Your presence stays live in the tray. Right-click the tray icon to quit.',
          icon: iconPath('icon-256.png')
        }).show()
      }
    } else {
      isQuitting = true
      app.quit()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const persistBounds = (): void => {
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized()) return
    const isMax = mainWindow.isMaximized()
    const normal = mainWindow.getNormalBounds()
    void saveWindowBounds({ ...normal, maximized: isMax })
  }
  mainWindow.on('resized', persistBounds)
  mainWindow.on('moved', persistBounds)
  mainWindow.on('maximize', persistBounds)
  mainWindow.on('unmaximize', persistBounds)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url) || url.startsWith('discord:')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow?.webContents.getURL() ?? ''
    if (url !== current) {
      event.preventDefault()
      if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    }
  })

  if (DEV_URL) {
    await mainWindow.loadURL(DEV_URL)
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

interface TrayPersona {
  id: string
  name: string
}

let trayPersonas: TrayPersona[] = []
let trayActiveId = ''
let trayLive = false

function buildTrayMenu(): void {
  if (!tray) return
  const active = trayPersonas.find((persona) => persona.id === trayActiveId)
  const menu = Menu.buildFromTemplate([
    {
      label: `Open ${APP_NAME}`,
      click: () => showWindow()
    },
    { type: 'separator' },
    {
      label: trayLive ? 'Presence is live' : 'Presence is idle',
      enabled: false
    },
    {
      label: trayLive ? 'Stop presence' : 'Go live',
      click: () => sendToRenderer('system:toggle-presence')
    },
    {
      label: `Persona: ${active?.name ?? 'None'}`,
      submenu:
        trayPersonas.length > 0
          ? trayPersonas.map((persona) => ({
              label: persona.name,
              type: 'radio' as const,
              checked: persona.id === trayActiveId,
              click: () => sendToRenderer('system:persona-switch', persona.id)
            }))
          : [{ label: 'No personas yet', enabled: false }]
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        showWindow()
        sendToRenderer('system:navigate', 'settings' satisfies ViewId)
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.setToolTip(`${APP_NAME} — ${trayLive ? 'Live' : 'Idle'}`)
}

function createTray(): void {
  try {
    const image = nativeImage.createFromPath(iconPath('tray.png'))
    tray = new Tray(image.isEmpty() ? nativeImage.createFromPath(iconPath()) : image)
    tray.on('click', () => showWindow())
    tray.on('double-click', () => showWindow())
    buildTrayMenu()
  } catch {
    tray = null
  }
}

function showWindow(): void {
  if (!mainWindow) {
    void createWindow()
    return
  }
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function applyLaunchAtLogin(enabled: boolean): boolean {
  if (!app.isPackaged) return enabled
  const executable = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: executable,
    args: []
  })
  return app.getLoginItemSettings({ path: executable }).openAtLogin
}

function applyHotkey(enabled: boolean): boolean {
  globalShortcut.unregister('CommandOrControl+Shift+P')
  if (enabled) {
    try {
      return globalShortcut.register('CommandOrControl+Shift+P', () => {
        sendToRenderer('system:toggle-presence')
      })
    } catch {
      return false
    }
  }
  return true
}

function registerIpc(): void {
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:toggle-maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  ipcMain.handle('store:load', async () => {
    currentState = await loadState()
    return currentState
  })
  ipcMain.handle('store:save', async (_event, state: AppState) => {
    currentState = state
    return saveState(state)
  })
  ipcMain.handle('store:export', async (_event, state: AppState) => exportState(state))
  ipcMain.handle('store:import', async () => {
    const state = await importState()
    if (state) currentState = state
    return state
  })
  ipcMain.handle('store:open-data-folder', async () => openDataFolder())
  ipcMain.handle('store:reset', async () => {
    await resetData()
    currentState = null
  })

  ipcMain.handle('rpc:connect', async (_event, appId: string) => rpc.connect(appId))
  ipcMain.handle('rpc:disconnect', async () => {
    await rpc.disconnect()
  })
  ipcMain.handle('rpc:set-activity', async (_event, appId: string, activity: RpcActivity) => {
    if (appId && appId !== rpc.getStatus().appId) {
      const connected = await rpc.connect(appId)
      if (connected.state !== 'connected') return connected
    }
    return rpc.setActivity(activity)
  })
  ipcMain.handle('rpc:clear', async () => {
    await rpc.clear()
  })
  ipcMain.handle('rpc:status', async () => rpc.getStatus())

  ipcMain.handle('widget:publish', async (_event, request: PublishRequest): Promise<PublishResponse> => {
    const appId = String(request.appId ?? '').trim()
    const userId = String(request.userId ?? '').trim()
    if (!/^\d{17,20}$/.test(appId)) {
      return { ok: false, status: 0, message: 'Enter a valid Discord Application ID (17–20 digits).' }
    }
    if (!/^\d{17,20}$/.test(userId)) {
      return { ok: false, status: 0, message: 'Enter a valid Discord User ID (17–20 digits).' }
    }

    let token = String(request.token ?? '').trim()
    if (!token) token = (await readBotToken()) ?? ''
    if (!token) {
      return { ok: false, status: 0, message: 'A bot token is required. Add it in the publish panel.' }
    }

    if (request.rememberToken && request.token) {
      try {
        await saveBotToken(request.token.trim())
      } catch (error) {
        return {
          ok: false,
          status: 0,
          message: error instanceof Error ? error.message : 'Could not store the token securely.'
        }
      }
    }

    const url = `https://discord.com/api/v9/applications/${appId}/users/${userId}/identities/0/profile`
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${token}`,
          'User-Agent': 'DiscordBot (https://github.com/4uthen7/presence-studio, 0.2.0)'
        },
        body: JSON.stringify(request.payload),
        signal: AbortSignal.timeout(20_000)
      })
      const body = await response.text()
      let message = response.ok ? 'Widget data published.' : 'Discord rejected the request.'
      try {
        const parsed = JSON.parse(body) as { message?: string; retry_after?: number; code?: number }
        if (parsed.message) {
          message = parsed.message
          if (response.status === 429 && parsed.retry_after) {
            message += ` Try again in ${Math.ceil(parsed.retry_after)}s.`
          }
          if (response.status === 401) message = 'The bot token was rejected. Reset it in the Developer Portal.'
          if (response.status === 403) {
            message = 'Discord refused the update. Re-authorize the app with the sdk.social_layer scope.'
          }
          if (response.status === 404) {
            message = 'App or user not found. Check the Application ID and User ID.'
          }
        }
      } catch {
        // Keep the fallback message for non-JSON responses.
      }
      return { ok: response.ok, status: response.status, message, body: body.slice(0, 4000) }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { ok: false, status: 0, message: `Network error: ${message}` }
    }
  })
  ipcMain.handle('widget:token-status', async () => tokenStatus())
  ipcMain.handle('widget:clear-token', async () => clearBotToken())
  ipcMain.handle('widget:open-external', async (_event, url: string) => {
    if (/^https?:\/\//i.test(url) || url.startsWith('discord:')) await shell.openExternal(url)
  })

  ipcMain.handle('dialog:pick-image', async () => pickImage())

  ipcMain.handle('system:get-info', async () => ({
    version: app.getVersion(),
    platform: process.platform,
    dataPath: app.getPath('userData')
  }))
  ipcMain.handle('system:set-launch-at-login', (_event, enabled: boolean) => applyLaunchAtLogin(enabled))
  ipcMain.handle('system:set-minimize-to-tray', (_event, enabled: boolean) => {
    runtime.minimizeToTray = enabled
    return enabled
  })
  ipcMain.handle('system:set-hotkey', (_event, enabled: boolean) => {
    runtime.hotkeyEnabled = enabled
    return applyHotkey(enabled)
  })
  ipcMain.on(
    'system:refresh-tray',
    (_event, personas: TrayPersona[], activeId: string, live: boolean) => {
      trayPersonas = Array.isArray(personas) ? personas : []
      trayActiveId = activeId
      trayLive = Boolean(live)
      buildTrayMenu()
    }
  )
}

rpc.on('status', (status: RpcStatus) => {
  broadcast('rpc:status', status)
  if (status.state === 'connected') {
    trayLive = Boolean(currentState?.presence.enabled)
    buildTrayMenu()
  }
})

async function maybeCapture(window: BrowserWindow): Promise<void> {
  const dir = path.resolve(process.env.PS_CAPTURE_DIR || 'screenshots')
  const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
  await fs.mkdir(dir, { recursive: true })
  await wait(2200)

  const capture = async (name: string): Promise<void> => {
    const image = await window.webContents.capturePage()
    await fs.writeFile(path.join(dir, `${name}.png`), image.toPNG())
  }

  const selectView = async (view: string): Promise<void> => {
    await window.webContents.executeJavaScript(
      `document.querySelector('[data-view="${view}"]')?.click()`
    )
    await wait(850)
  }

  for (const view of ['studio', 'widgets', 'profiles', 'library', 'settings']) {
    await selectView(view)
    await capture(view)
  }

  await window.webContents.executeJavaScript(
    `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))`
  )
  await wait(500)
  await capture('command')
  await window.webContents.executeJavaScript(
    `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`
  )
  await wait(300)

  await selectView('widgets')
  await window.webContents.executeJavaScript(`
    [...document.querySelectorAll('.page-head-actions button')].find((el) => el.textContent?.includes('Publish'))?.click()
  `)
  await wait(900)
  await capture('publish')
  await window.webContents.executeJavaScript(
    `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`
  )
  await wait(300)

  await selectView('profiles')
  await window.webContents.executeJavaScript(
    `document.querySelector('.persona-card .icon-btn')?.click()`
  )
  await wait(900)
  await capture('persona-editor')

  app.quit()
}

app.on('second-instance', () => showWindow())

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  registerIpc()
  await createWindow()
  createTray()
  applyHotkey(true)
  if (process.env.PS_CAPTURE && mainWindow) {
    void maybeCapture(mainWindow)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow()
    else showWindow()
  })
})

app.on('window-all-closed', () => {
  if (!runtime.minimizeToTray) {
    isQuitting = true
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  rpc.dispose()
  globalShortcut.unregisterAll()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

process.on('uncaughtException', (error) => {
  console.error('[main] uncaught exception', error)
  if (isDev) sendToRenderer('app:error', String(error))
})
