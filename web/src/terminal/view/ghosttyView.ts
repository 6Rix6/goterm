import { Terminal as Ghostty, FitAddon, init } from "ghostty-web"
import {
  TerminalView,
  type Disposable,
  type TerminalSize,
  type TerminalViewOptions,
} from "./terminalView"

type GhosttyViewOptions = TerminalViewOptions

const DEFAULT_FONT_FAMILY = '"JetBrains Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace'

export class GhosttyView extends TerminalView {
  #term?: Ghostty
  #fitAddon = new FitAddon()
  #disposed = false

  #opts: GhosttyViewOptions

  constructor(opts: GhosttyViewOptions = {}) {
    super()

    this.#opts = opts
  }

  async mount(container: HTMLElement): Promise<void> {
    const fontSize = this.#opts.fontSize ?? 15

    await Promise.all([
      document.fonts.load(`${fontSize}px "JetBrains Mono"`),
      document.fonts.load(`bold ${fontSize}px "JetBrains Mono"`),
    ])
    await document.fonts.ready

    await init()

    if (this.#disposed) return

    const term = new Ghostty({
      cursorBlink: true,
      fontFamily: this.#opts.fontFamily ?? DEFAULT_FONT_FAMILY,
      fontSize,
    })

    term.loadAddon(this.#fitAddon)
    term.open(container)
    this.#fitAddon.fit()

    this.#term = term
  }

  write(data: Uint8Array | string) {
    this.#term?.write(data)
  }

  focus() {
    this.#term?.focus()
  }

  fit(): TerminalSize {
    if (!this.#term) return { cols: 80, rows: 24 }
    this.#fitAddon.fit()
    return { cols: this.#term.cols, rows: this.#term.rows }
  }

  onInput(cb: (data: string) => void): Disposable {
    return this.#term?.onData(cb) ?? { dispose() {} }
  }

  dispose() {
    this.#disposed = true
    this.#term?.dispose()
    this.#term = undefined
  }
}
