import { Terminal as XTerm } from "@xterm/xterm"
import { Unicode11Addon } from "@xterm/addon-unicode11"
import { WebglAddon } from "@xterm/addon-webgl"
import "@xterm/xterm/css/xterm.css"
import {
  TerminalView,
  type Disposable,
  type TerminalSize,
  type TerminalViewOptions,
} from "./terminalView"
import { TerminalIO } from "../io/terminalIO.ts"
import type { PreferenceManager } from "../../prefs/preferenceManager"
import { PrefObserverGroup } from "../../prefs/prefObserverGroup.ts"
import { WebLinksAddon } from "@xterm/addon-web-links"

type XtermViewOptions = TerminalViewOptions & {
  webgl?: boolean
}

const DEFAULT_FONT_FAMILY = `"JetBrains Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace`

export class XtermView extends TerminalView {
  #term?: XTerm
  #container?: HTMLElement
  #disposed = false
  #opts: XtermViewOptions
  #io: TerminalIO
  #prefs: PrefObserverGroup

  constructor(prefsManager: PreferenceManager, opts: XtermViewOptions) {
    super()

    this.#prefs = new PrefObserverGroup(prefsManager)
    this.#opts = opts
    this.#io = new TerminalIO({
      ctrlVPaste: () => this.#prefs.get("terminal.keybind.ctrl-v-paste"),
      ctrlCCopy: () => this.#prefs.get("terminal.keybind.ctrl-c-copy"),
      rightClick: () => this.#prefs.get("terminal.mouse.rightClick"),
    })
  }

  async mount(container: HTMLElement): Promise<void> {
    this.#container = container

    const fontSize = this.#opts.fontSize ?? this.#prefs.get("terminal.appearance.fontSize")

    try {
      await Promise.all([
        document.fonts.load(`${fontSize}px "JetBrains Mono"`),
        document.fonts.load(`bold ${fontSize}px "JetBrains Mono"`),
      ])
      await document.fonts.ready
    } catch {}

    if (this.#disposed) return

    const term = new XTerm({
      rescaleOverlappingGlyphs: true,
      allowProposedApi: true,
      cursorBlink: this.#prefs.get("terminal.appearance.cursorBlink"),
      fontFamily: this.#opts.fontFamily ?? DEFAULT_FONT_FAMILY,
      fontSize,
      lineHeight: this.#prefs.get("terminal.appearance.lineHeight"),
      letterSpacing: 0,
      allowTransparency: true,
      scrollbar: {
        showScrollbar: this.#prefs.get("terminal.appearance.showScrollbar"),
      },
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

    term.loadAddon(new Unicode11Addon())
    term.open(container)
    term.unicode.activeVersion = "11"

    this.#io.attach(term)
    this.fit()

    if (this.#isWebglSupported() && this.#opts.webgl) {
      term.loadAddon(new WebglAddon())
    }

    term.loadAddon(new WebLinksAddon())

    this.#prefs.observe("terminal.appearance.fontSize", (v) => (term.options = { fontSize: v }))
    this.#prefs.observe("terminal.appearance.lineHeight", (v) => (term.options = { lineHeight: v }))
    this.#prefs.observe(
      "terminal.appearance.cursorBlink",
      (v) => (term.options = { cursorBlink: v }),
    )
    this.#prefs.observe(
      "terminal.appearance.showScrollbar",
      (v) => (term.options = { scrollbar: { showScrollbar: v } }),
    )

    this.#term = term
  }

  write(data: Uint8Array | string) {
    this.#term?.write(data)
  }

  focus() {
    this.#term?.focus()
  }

  fit(): TerminalSize {
    if (!this.#term || !this.#container) return { cols: 80, rows: 24 }

    const screenPaddingSize = 0.0
    const cellDimensions = this.#term.dimensions?.css.cell

    if (!cellDimensions) return { cols: 80, rows: 24 }

    const calc = (size: number, cellSize: number) => {
      return Math.floor((size - 2 * screenPaddingSize) / cellSize)
    }
    const cols = calc(this.#container.offsetWidth, cellDimensions.width)
    const rows = calc(this.#container.offsetHeight, cellDimensions.height)

    if (cols >= 0 && rows >= 0) {
      this.#term.resize(cols, rows)
    }

    return { cols, rows }
  }

  onInput(cb: (data: string) => void): Disposable {
    return this.#term?.onData(cb) ?? { dispose() {} }
  }

  onTitleChange(cb: (title: string) => void): Disposable {
    return this.#term?.onTitleChange(cb) ?? { dispose() {} }
  }

  dispose() {
    this.#disposed = true
    this.#term?.dispose()
    this.#term = undefined
    this.#io.dispose()
    this.#prefs.dispose()
  }

  #isWebglSupported() {
    return document.createElement("canvas").getContext("webgl2")
  }
}
