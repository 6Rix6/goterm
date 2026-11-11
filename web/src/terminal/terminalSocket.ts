export type Status = "connecting" | "connected" | "disconnected" | "unauthorized"

type Options = {
  token: string
  sessionId?: string
  onOpen?: () => void
  onData?: (data: Uint8Array) => void
  onStatus?: (s: Status) => void
  getSize: () => { cols: number; rows: number }
}

export class TerminalSocket {
  #ws: WebSocket
  #encoder = new TextEncoder()

  constructor(opts: Options) {
    const proto = location.protocol === "https:" ? "wss" : "ws"
    this.#ws = new WebSocket(`${proto}://${location.host}/ws`)
    this.#ws.binaryType = "arraybuffer"
    opts.onStatus?.("connecting")

    this.#ws.onopen = () => {
      const { cols, rows } = opts.getSize()
      this.sendJson({ type: "init", token: opts.token, cols, rows, session_id: opts.sessionId })
      opts.onStatus?.("connected")
      opts.onOpen?.()
    }

    this.#ws.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      opts.onData?.(new Uint8Array(e.data))
    }

    this.#ws.onclose = (e) => {
      opts.onStatus?.(e.code === 1008 ? "unauthorized" : "disconnected")
    }
  }

  get isOpen(): boolean {
    return this.#ws.readyState === WebSocket.OPEN
  }

  sendInput(data: string) {
    if (this.isOpen) this.#ws.send(this.#encoder.encode(data))
  }

  sendResize(cols: number, rows: number) {
    this.sendJson({ type: "resize", cols, rows })
  }

  close() {
    this.#ws.close()
  }

  private sendJson(msg: unknown) {
    if (this.isOpen) this.#ws.send(JSON.stringify(msg))
  }
}
