import { Terminal as XTerm } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { Unicode11Addon } from "@xterm/addon-unicode11"
import { WebglAddon } from "@xterm/addon-webgl"
import "@xterm/xterm/css/xterm.css"
import {
  TerminalView,
  type Disposable,
  type TerminalSize,
  type TerminalViewOptions,
} from "./terminalView"

type XtermViewOptions = TerminalViewOptions & {
  webgl?: boolean
}

const DEFAULT_FONT_FAMILY = '"JetBrains Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace'

export class XtermView extends TerminalView {
  #term?: XTerm
  #fitAddon = new FitAddon()
  #disposed = false

  #opts: XtermViewOptions

  constructor(opts: XtermViewOptions = {}) {
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

    if (this.#disposed) return

    const term = new XTerm({
      allowProposedApi: true,
      cursorBlink: true,
      fontFamily: this.#opts.fontFamily ?? DEFAULT_FONT_FAMILY,
      fontSize,
      allowTransparency: true,
      theme: {
        cursorAccent: "rgba(0, 0, 0, 0)",
        selectionBackground: "rgba(174, 203, 250, .6)",
        selectionInactiveBackground: "rgba(218, 220, 224, .6)",
        selectionForeground: "black",
        background: "#00000000",
        cursor: "rgba(255, 255, 255, 0.5019607843137255)",
        black: "rgb(91, 48, 98)",
        red: "rgb(246, 174, 169)",
        green: "rgb(205, 216, 250)",
        yellow: "rgb(247, 255, 164)",
        blue: "rgb(149, 111, 228)",
        magenta: "rgb(249, 148, 255)",
        cyan: "rgb(135, 255, 197)",
        white: "rgb(44, 34, 46)",
        brightBlack: "rgb(251, 225, 255)",
        brightRed: "rgb(249, 198, 195)",
        brightGreen: "rgb(151, 176, 252)",
        brightYellow: "rgb(241, 255, 103)",
        brightBlue: "rgb(211, 190, 255)",
        brightMagenta: "rgb(251, 180, 255)",
        brightCyan: "rgb(171, 255, 214)",
        brightWhite: "rgb(118, 66, 125)",
        foreground: "rgb(255, 255, 255)",
      },
    })

    term.loadAddon(this.#fitAddon)
    term.loadAddon(new Unicode11Addon())
    term.open(container)
    term.unicode.activeVersion = "11"
    this.#fitAddon.fit()

    if (this.#isWebglSupported() && this.#opts.webgl) {
      term.loadAddon(new WebglAddon())
    }

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

  #isWebglSupported() {
    return document.createElement("canvas").getContext("webgl2")
  }
}
