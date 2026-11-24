import type { Disposable } from "./view/terminalView"

export type Status = "connecting" | "connected" | "disconnected" | "unauthorized"

type Options = {
  token: string
  sessionId?: string
  onOpen?: () => void
  onData?: (data: Uint8Array) => void
  onStatus?: (s: Status) => void
  getSize: () => { cols: number; rows: number }
}

const MESSAGE_TYPES = ["session", "init", "resize"] as const

type MessageType = (typeof MESSAGE_TYPES)[number]

interface ControlMessage {
  type: MessageType
  token?: string
  session_id?: string
  session_title?: string
  pinned?: boolean
  cols?: number
  rows?: number
}

const BASE_DELAY_MS = 500
const MAX_DELAY_MS = 10_000

export class TerminalSocket {
  #ws!: WebSocket
  #encoder = new TextEncoder()
  #opts: Options
  #closedByUser = false
  #attempt = 0
  #retryTimer?: ReturnType<typeof setTimeout>
  #titleListeners = new Set<(title: string | undefined) => void>()

  sessionId?: string

  constructor(opts: Options) {
    this.#opts = opts
    this.sessionId = opts.sessionId
    this.#connect()
  }

  #connect() {
    const opts = this.#opts
    const proto = location.protocol === "https:" ? "wss" : "ws"
    const ws = new WebSocket(`${proto}://${location.host}/ws`)
    ws.binaryType = "arraybuffer"
    this.#ws = ws
    opts.onStatus?.("connecting")

    ws.onopen = () => {
      this.#attempt = 0
      const { cols, rows } = opts.getSize()
      this.#sendJson({ type: "init", token: opts.token, cols, rows, session_id: this.sessionId })
      opts.onStatus?.("connected")
      opts.onOpen?.()
    }

    ws.onmessage = (e: MessageEvent<ArrayBuffer | string>) => {
      if (typeof e.data == "string") {
        try {
          const raw: unknown = JSON.parse(e.data)
          if (isControlMessage(raw)) {
            this.#handleSessionControl(raw)
          }
        } catch {}
      } else {
        opts.onData?.(new Uint8Array(e.data))
      }
    }

    ws.onclose = (e) => {
      if (ws !== this.#ws) return

      if (e.code === 1008) {
        opts.onStatus?.("unauthorized")
        return
      }
      opts.onStatus?.("disconnected")
      if (!this.#closedByUser) this.#scheduleReconnect()
    }
  }

  #scheduleReconnect() {
    const exp = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** this.#attempt)
    const delay = exp / 2 + Math.random() * (exp / 2)
    this.#attempt++
    this.#retryTimer = setTimeout(() => this.#connect(), delay)
  }

  #handleSessionControl(msg: ControlMessage) {
    if (msg.type !== "session") return
    console.log(msg)
    this.sessionId = msg.session_id

    const title = msg.session_title
    for (const cb of this.#titleListeners) {
      cb(title)
    }
  }

  #sendJson(msg: ControlMessage) {
    if (this.isOpen) this.#ws.send(JSON.stringify(msg))
  }

  get isOpen(): boolean {
    return this.#ws.readyState === WebSocket.OPEN
  }

  sendInput(data: string) {
    if (this.isOpen) this.#ws.send(this.#encoder.encode(data))
  }

  sendResize(cols: number, rows: number) {
    this.#sendJson({ type: "resize", cols, rows })
  }

  onTitleChange(cb: (title: string | undefined) => void): Disposable {
    this.#titleListeners.add(cb)
    return {
      dispose: () => {
        this.#titleListeners.delete(cb)
      },
    }
  }

  close() {
    this.#closedByUser = true
    this.#titleListeners.clear()
    clearTimeout(this.#retryTimer)
    this.#ws.close()
  }
}

function isControlMessage(data: unknown): data is ControlMessage {
  if (typeof data !== "object" || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>

  const hasValidType =
    typeof obj.type === "string" && (MESSAGE_TYPES as readonly string[]).includes(obj.type)

  if (!hasValidType) {
    return false
  }

  if (obj.cols !== undefined && typeof obj.cols === "number") {
    return false
  }

  if (obj.rows !== undefined && typeof obj.rows === "number") {
    return false
  }

  if (obj.token !== undefined && typeof obj.token !== "string") {
    return false
  }

  if (obj.session_id !== undefined && typeof obj.session_id !== "string") {
    return false
  }

  if (obj.session_title !== undefined && typeof obj.session_title !== "string") {
    return false
  }

  if (obj.pinned !== undefined && typeof obj.pinned !== "boolean") {
    return false
  }

  return true
}
