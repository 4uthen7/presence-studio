import { app, dialog, safeStorage, shell } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { AppState, ImagePickResult, SecureTokenStatus } from '../shared/types'

const STATE_FILE = 'presence-studio.json'
const SECRETS_FILE = 'secrets.json'
const WINDOW_FILE = 'window.json'

interface SecretsFile {
  botToken?: string
  encrypted?: boolean
}

export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
  maximized?: boolean
}

function dataDir(): string {
  return app.getPath('userData')
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true })
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(dataDir(), file), 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function writeJsonAtomic(file: string, value: unknown): Promise<void> {
  await ensureDir()
  const target = path.join(dataDir(), file)
  const temp = `${target}.${process.pid}.tmp`
  await fs.writeFile(temp, JSON.stringify(value, null, 2), 'utf8')
  await fs.rename(temp, target)
}

export async function loadState(): Promise<AppState | null> {
  const state = await readJson<AppState>(STATE_FILE)
  if (!state || typeof state !== 'object') return null
  return state
}

export async function saveState(state: AppState): Promise<boolean> {
  if (!state || typeof state !== 'object') return false
  await writeJsonAtomic(STATE_FILE, state)
  return true
}

export async function exportState(state: AppState): Promise<string | null> {
  const result = await dialog.showSaveDialog({
    title: 'Export Presence Studio data',
    defaultPath: path.join(app.getPath('documents'), `presence-studio-${new Date().toISOString().slice(0, 10)}.json`),
    filters: [{ name: 'Presence Studio JSON', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) return null
  await fs.writeFile(result.filePath, JSON.stringify(state, null, 2), 'utf8')
  return result.filePath
}

export async function importState(): Promise<AppState | null> {
  const result = await dialog.showOpenDialog({
    title: 'Import Presence Studio data',
    properties: ['openFile'],
    filters: [{ name: 'Presence Studio JSON', extensions: ['json'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const raw = await fs.readFile(result.filePaths[0], 'utf8')
  const parsed = JSON.parse(raw) as AppState
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.personas) || !parsed.presence) {
    throw new Error('This file is not a valid Presence Studio export.')
  }
  return parsed
}

export async function openDataFolder(): Promise<void> {
  await ensureDir()
  await shell.openPath(dataDir())
}

export async function resetData(): Promise<void> {
  await Promise.all([
    fs.rm(path.join(dataDir(), STATE_FILE), { force: true }),
    fs.rm(path.join(dataDir(), SECRETS_FILE), { force: true })
  ])
}

export async function readWindowBounds(): Promise<WindowBounds | null> {
  return readJson<WindowBounds>(WINDOW_FILE)
}

export async function saveWindowBounds(bounds: WindowBounds): Promise<void> {
  try {
    await writeJsonAtomic(WINDOW_FILE, bounds)
  } catch {
    // Window bounds are a convenience; never block shutdown on them.
  }
}

function secretPath(): string {
  return path.join(dataDir(), SECRETS_FILE)
}

export async function saveBotToken(token: string): Promise<void> {
  await ensureDir()
  const payload: SecretsFile = { encrypted: false }
  if (safeStorage.isEncryptionAvailable()) {
    payload.botToken = safeStorage.encryptString(token).toString('base64')
    payload.encrypted = true
  } else {
    // Never write a plaintext token when no OS keystore is available.
    throw new Error('Secure storage is unavailable on this system, so the token was not saved.')
  }
  await fs.writeFile(secretPath(), JSON.stringify(payload), { encoding: 'utf8', mode: 0o600 })
}

export async function readBotToken(): Promise<string | null> {
  try {
    const raw = await fs.readFile(secretPath(), 'utf8')
    const payload = JSON.parse(raw) as SecretsFile
    if (!payload.botToken) return null
    if (payload.encrypted) {
      if (!safeStorage.isEncryptionAvailable()) return null
      return safeStorage.decryptString(Buffer.from(payload.botToken, 'base64'))
    }
    return null
  } catch {
    return null
  }
}

export async function clearBotToken(): Promise<void> {
  await fs.rm(secretPath(), { force: true })
}

export async function tokenStatus(): Promise<SecureTokenStatus> {
  const token = await readBotToken()
  return {
    hasToken: Boolean(token),
    storage: safeStorage.isEncryptionAvailable() ? 'dpapi' : 'none'
  }
}

export async function pickImage(): Promise<ImagePickResult | null> {
  const result = await dialog.showOpenDialog({
    title: 'Choose an image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  const buffer = await fs.readFile(filePath)
  if (buffer.byteLength > 12 * 1024 * 1024) {
    throw new Error('Image is larger than 12 MB. Choose a smaller file.')
  }
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mime = ext === 'jpg' ? 'jpeg' : ext
  return {
    dataUrl: `data:image/${mime};base64,${buffer.toString('base64')}`,
    name: path.basename(filePath),
    width: 0,
    height: 0
  }
}
