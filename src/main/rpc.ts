import { EventEmitter } from 'node:events'
import net from 'node:net'
import { randomUUID } from 'node:crypto'
import type { RpcActivity, RpcStatus } from '../shared/types'

const OP_HANDSHAKE = 0
const OP_FRAME = 1
const OP_CLOSE = 2
const OP_PING = 3
const OP_PONG = 4

interface DiscordFrame {
  cmd?: string
  evt?: string | null
  nonce?: string | null
  data?: Record<string, unknown> | null
}

function encodeFrame(op: number, payload: unknown): Buffer {
  const json = Buffer.from(JSON.stringify(payload), 'utf8')
  const header = Buffer.alloc(8)
  header.writeUInt32LE(op, 0)
  header.writeUInt32LE(json.length, 4)
  return Buffer.concat([header, json])
}

/**
 * The UI keeps a flat activity shape because it is easy to edit.
 * Discord's local IPC expects the nested RPC activity object with snake_case
 * keys, so convert at the wire boundary.
 */
export function toWireActivity(activity: RpcActivity): Record<string, unknown> {
  const wire: Record<string, unknown> = {
    type: activity.type,
    instance: Boolean(activity.instance)
  }

  if (activity.details) wire.details = activity.details
  if (activity.state) wire.state = activity.state
  if (activity.startTimestamp || activity.endTimestamp) {
    wire.timestamps = {
      ...(activity.startTimestamp ? { start: activity.startTimestamp } : {}),
      ...(activity.endTimestamp ? { end: activity.endTimestamp } : {})
    }
  }
  if (activity.largeImageKey || activity.largeImageText || activity.smallImageKey || activity.smallImageText) {
    wire.assets = {
      ...(activity.largeImageKey ? { large_image: activity.largeImageKey } : {}),
      ...(activity.largeImageText ? { large_text: activity.largeImageText } : {}),
      ...(activity.smallImageKey ? { small_image: activity.smallImageKey } : {}),
      ...(activity.smallImageText ? { small_text: activity.smallImageText } : {})
    }
  }
  if (activity.partyId || activity.partySize !== undefined || activity.partyMax !== undefined) {
    wire.party = {
      ...(activity.partyId ? { id: activity.partyId } : {}),
      ...(activity.partySize !== undefined && activity.partyMax !== undefined
        ? { size: [activity.partySize, activity.partyMax] }
        : {})
    }
  }
  if (activity.buttons && activity.buttons.length > 0) {
    wire.buttons = activity.buttons
  }
  if (activity.statusDisplayType !== undefined) {
    wire.status_display_type = activity.statusDisplayType
  }

  return wire
}

function candidatePipes(): string[] {
  const paths: string[] = []
  if (process.platform === 'win32') {
    for (let i = 0; i < 10; i += 1) paths.push(`\\\\?\\pipe\\discord-ipc-${i}`)
    return paths
  }
  const base =
    process.env.XDG_RUNTIME_DIR ||
    process.env.TMPDIR ||
    process.env.TMP ||
    process.env.TEMP ||
    '/tmp'
  for (let i = 0; i < 10; i += 1) paths.push(`${base.replace(/\/$/, '')}/discord-ipc-${i}`)
  return paths
}

class DiscordIpc extends EventEmitter {
  private socket: net.Socket | null = null
  private buffer = Buffer.alloc(0)
  private pending = new Map<string, { resolve: (value: DiscordFrame) => void; reject: (error: Error) => void }>()
  private closed = false

  async connect(appId: string, timeoutMs = 9000): Promise<DiscordFrame> {
    const deadline = Date.now() + timeoutMs
    let lastError: Error | null = null
    this.closed = false

    for (const pipe of candidatePipes()) {
      if (Date.now() > deadline) break
      let socket: net.Socket
      try {
        socket = await this.openPipe(pipe, Math.min(900, Math.max(180, deadline - Date.now())))
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        continue
      }

      this.socket = socket
      this.attach(socket)
      try {
        return await this.handshake(appId, Math.min(6500, deadline - Date.now()))
      } catch (error) {
        this.destroy()
        // A pipe answered but rejected the handshake; trying more pipes will not help.
        throw error instanceof Error ? error : new Error(String(error))
      }
    }

    if (Date.now() > deadline && !lastError) {
      throw new Error('Discord did not answer in time. Is the desktop client running?')
    }
    throw lastError ?? new Error('Could not find Discord. Make sure the desktop client is running.')
  }

  private openPipe(pipe: string, timeoutMs: number): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(pipe)
      let settled = false
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        socket.destroy()
        reject(new Error('Discord IPC connection timed out.'))
      }, timeoutMs)

      socket.once('connect', () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(socket)
      })
      socket.once('error', (error) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        socket.destroy()
        reject(error)
      })
    })
  }

  private attach(socket: net.Socket): void {
    socket.on('data', (chunk) => this.onData(chunk))
    socket.on('error', (error) => {
      if (this.closed) return
      this.emit('error', error)
    })
    socket.on('close', () => {
      this.closed = true
      for (const waiter of this.pending.values()) waiter.reject(new Error('Discord IPC connection closed.'))
      this.pending.clear()
      this.emit('close')
    })
  }

  private onData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (this.buffer.length >= 8) {
      const op = this.buffer.readUInt32LE(0)
      const length = this.buffer.readUInt32LE(4)
      if (this.buffer.length < 8 + length) break
      const payload = this.buffer.subarray(8, 8 + length).toString('utf8')
      this.buffer = this.buffer.subarray(8 + length)
      let frame: DiscordFrame
      try {
        frame = JSON.parse(payload) as DiscordFrame
      } catch {
        continue
      }
      this.handleFrame(op, frame)
    }
  }

  private handleFrame(op: number, frame: DiscordFrame): void {
    if (op === OP_PING) {
      this.sendRaw(OP_PONG, frame)
      return
    }
    if (op === OP_CLOSE) {
      const data = frame as unknown as { code?: number; message?: string }
      const error = new Error(
        data.message ?? `Discord closed the IPC connection${data.code ? ` (${data.code})` : ''}.`
      )
      if (this.listenerCount('error') > 0) this.emit('error', error)
      this.emit('close')
      this.destroy()
      return
    }
    if (frame.nonce) {
      const waiter = this.pending.get(frame.nonce)
      if (waiter) {
        this.pending.delete(frame.nonce)
        if (frame.evt === 'ERROR') {
          const data = (frame.data ?? {}) as { code?: number; message?: string }
          waiter.reject(new Error(data.message || `Discord rejected the activity (code ${data.code ?? 'unknown'}).`))
        } else {
          waiter.resolve(frame)
        }
        return
      }
    }
    this.emit('frame', frame)
  }

  private handshake(appId: string, timeoutMs: number): Promise<DiscordFrame> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup()
        reject(new Error('Discord did not complete the handshake. Check the Application ID.'))
      }, timeoutMs)

      const onFrame = (frame: DiscordFrame) => {
        if (frame.evt === 'READY') {
          cleanup()
          resolve(frame)
        }
      }
      const onError = (error: Error) => {
        cleanup()
        reject(error)
      }
      const onClose = () => {
        cleanup()
        reject(new Error('Discord closed the connection during the handshake.'))
      }
      const cleanup = () => {
        clearTimeout(timer)
        this.off('frame', onFrame)
        this.off('error', onError)
        this.off('close', onClose)
      }

      this.on('frame', onFrame)
      this.on('error', onError)
      this.on('close', onClose)
      this.sendRaw(OP_HANDSHAKE, { v: 1, client_id: appId })
    })
  }

  request(cmd: string, args: Record<string, unknown>, timeoutMs = 6000): Promise<DiscordFrame> {
    const nonce = randomUUID()
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(nonce)
        reject(new Error(`Discord did not answer ${cmd} in time.`))
      }, timeoutMs)
      this.pending.set(nonce, {
        resolve: (frame) => {
          clearTimeout(timer)
          resolve(frame)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        }
      })
      this.sendRaw(OP_FRAME, { cmd, args, nonce })
    })
  }

  private sendRaw(op: number, payload: unknown): void {
    if (!this.socket || this.socket.destroyed) throw new Error('Discord IPC is not connected.')
    this.socket.write(encodeFrame(op, payload))
  }

  destroy(): void {
    this.closed = true
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.destroy()
      this.socket = null
    }
    this.buffer = Buffer.alloc(0)
    for (const waiter of this.pending.values()) waiter.reject(new Error('Discord IPC was closed.'))
    this.pending.clear()
  }
}

interface ReadyUser {
  id?: string
  username?: string
  discriminator?: string
  avatar?: string
}

export class RpcManager extends EventEmitter {
  private ipc: DiscordIpc | null = null
  private status: RpcStatus = { state: 'disconnected' }
  private appId = ''
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private shouldReconnect = false
  private lastActivity: RpcActivity | null = null
  private connectPromise: Promise<RpcStatus> | null = null

  getStatus(): RpcStatus {
    return this.status
  }

  private setStatus(next: RpcStatus): void {
    this.status = next
    this.emit('status', next)
  }

  async connect(appId: string): Promise<RpcStatus> {
    if (this.connectPromise) return this.connectPromise
    this.connectPromise = this.connectInternal(appId.trim())
    try {
      return await this.connectPromise
    } finally {
      this.connectPromise = null
    }
  }

  private async connectInternal(clean: string): Promise<RpcStatus> {
    if (!/^\d{17,20}$/.test(clean)) {
      const status: RpcStatus = {
        state: 'error',
        appId: clean,
        message: 'Application ID は17〜20桁の数字で指定してください。'
      }
      this.setStatus(status)
      return status
    }

    if (this.ipc && this.status.state === 'connected' && this.appId === clean) {
      return this.status
    }

    this.shouldReconnect = true
    this.clearReconnect()
    await this.teardown(false)
    this.appId = clean
    this.setStatus({ state: 'connecting', appId: clean, message: 'Looking for the Discord desktop client…' })

    try {
      const ipc = new DiscordIpc()
      this.ipc = ipc
      ipc.on('close', () => {
        if (this.ipc !== ipc) return
        this.ipc = null
        this.setStatus({
          state: 'disconnected',
          appId: this.appId,
          message: 'Discord closed the connection. Retrying in the background.'
        })
        this.scheduleReconnect()
      })
      ipc.on('error', (error: Error) => {
        if (this.ipc !== ipc) return
        this.setStatus({ state: 'error', appId: this.appId, message: error.message })
      })

      const ready = await ipc.connect(clean)
      const user = (ready.data?.user ?? {}) as ReadyUser
      this.reconnectAttempts = 0
      this.setStatus({
        state: 'connected',
        appId: clean,
        since: Date.now(),
        message: 'Connected to Discord',
        user: {
          id: String(user.id ?? ''),
          username: String(user.username ?? 'Discord user'),
          discriminator: user.discriminator ? String(user.discriminator) : undefined,
          avatar: user.avatar ? String(user.avatar) : undefined
        }
      })

      if (this.lastActivity) {
        void this.pushActivity(this.lastActivity).catch(() => undefined)
      }
      return this.status
    } catch (error) {
      this.ipc?.destroy()
      this.ipc = null
      let message = error instanceof Error ? error.message : String(error)
      const invalidClient = /invalid client id/i.test(message)
      if (invalidClient) {
        message = 'Application ID が無効です。Developer Portal の Application ID を確認してください。'
        this.shouldReconnect = false
      }
      this.setStatus({ state: 'error', appId: clean, message })
      if (!invalidClient) this.scheduleReconnect()
      return this.status
    }
  }

  async setActivity(activity: RpcActivity): Promise<RpcStatus> {
    this.lastActivity = activity
    if (!this.ipc || this.status.state !== 'connected') {
      const connected = await this.connect(this.appId)
      if (connected.state !== 'connected') return connected
    }
    try {
      await this.pushActivity(activity)
      return this.status
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.setStatus({ ...this.status, state: 'error', message })
      return this.status
    }
  }

  private async pushActivity(activity: RpcActivity): Promise<void> {
    if (!this.ipc) throw new Error('Discord is not connected.')
    await this.ipc.request('SET_ACTIVITY', { pid: process.pid, activity: toWireActivity(activity) })
  }

  async clear(): Promise<void> {
    this.lastActivity = null
    if (this.ipc && this.status.state === 'connected') {
      await this.ipc.request('SET_ACTIVITY', { pid: process.pid, activity: null }).catch(() => undefined)
    }
  }

  async disconnect(): Promise<void> {
    this.shouldReconnect = false
    this.clearReconnect()
    this.lastActivity = null
    await this.teardown(true)
  }

  private async teardown(broadcast: boolean): Promise<void> {
    if (this.ipc) {
      this.ipc.removeAllListeners()
      try {
        await this.ipc.request('SET_ACTIVITY', { pid: process.pid, activity: null }, 800)
      } catch {
        // The client may already be gone.
      }
      this.ipc.destroy()
      this.ipc = null
    }
    if (broadcast) {
      this.setStatus({ state: 'disconnected', appId: this.appId })
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) return
    const delay = Math.min(30_000, 2_000 * 2 ** Math.min(this.reconnectAttempts, 4))
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.shouldReconnect || !this.appId) return
      void this.connect(this.appId)
    }, delay)
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  dispose(): void {
    this.shouldReconnect = false
    this.clearReconnect()
    this.ipc?.destroy()
    this.ipc = null
  }
}
