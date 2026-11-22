import type { Terminal as XTerm } from "@xterm/xterm"
import type { Disposable } from "../view/terminalView.ts"
import { KeybindingManager, type KeyBinding } from "./keybindings"

export type RightClickMode = "none" | "paste" | "copyPaste" | "menu"

const isMac = navigator.platform.toLowerCase().includes("mac")

export type TerminalIOOptions = {
  ctrlVPaste: () => boolean
  ctrlCCopy: () => boolean
  rightClick: () => RightClickMode
}

export class TerminalIO {
  readonly keybindings = new KeybindingManager()
  #term?: XTerm
  #disposables: Disposable[] = []
  #opts: TerminalIOOptions

  constructor(opts: TerminalIOOptions) {
    this.#opts = opts
  }

  attach(term: XTerm) {
    this.#term = term
    term.attachCustomKeyEventHandler(this.keybindings.handle)
    this.#registerDefaultBindings()
    this.#registerOsc52(term)
    this.#registerContextMenu(term)
  }

  async copySelection() {
    const text = this.#term?.getSelection()
    if (text) await navigator.clipboard.writeText(text)
  }

  async copyAndClear() {
    await this.copySelection()
    this.#term?.clearSelection()
  }

  async paste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) this.#term?.paste(text)
    } catch {}
  }

  get hasSelection(): boolean {
    return !!this.#term?.hasSelection()
  }

  addKeyBinding(binding: KeyBinding) {
    this.addKeyBindings(binding)
  }

  addKeyBindings(...bindings: KeyBinding[]) {
    this.#disposables.push(...bindings.map((b) => this.keybindings.add(b)))
  }

  #registerDefaultBindings() {
    this.addKeyBindings(
      // Ctrl+Shift+C: Always copy (to avoid conflict with DevTools)
      {
        combo: { key: "c", ctrl: true, shift: true },
        run: () => void this.copyAndClear(),
      },
      // Ctrl+C: Copy only when pref is ON and there is a selection. Otherwise, pass to xterm as SIGINT
      {
        combo: { key: "c", ctrl: true },
        when: () => this.#opts.ctrlCCopy() && this.hasSelection,
        run: () => void this.copyAndClear(),
      },
      // Ctrl+V: Do not send \x16, leave it to the native paste event
      {
        combo: { key: "v", ctrl: true },
        when: () => this.#opts.ctrlVPaste(),
        preventDefault: false,
      },
    )

    if (isMac) {
      this.addKeyBindings(
        {
          combo: { key: "c", meta: true },
          when: () => this.hasSelection,
          run: () => void this.copySelection(),
        },
        { combo: { key: "v", meta: true }, preventDefault: false },
      )
    }
  }

  #registerOsc52(term: XTerm) {
    this.#disposables.push(
      term.parser.registerOscHandler(52, (data) => {
        const [, b64] = data.split(";")
        if (!b64 || b64 === "?") return true // Ignore read requests
        try {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
          void navigator.clipboard.writeText(new TextDecoder().decode(bytes))
        } catch {}
        return true
      }),
    )
  }

  #registerContextMenu(term: XTerm) {
    const el = term.element
    if (!el) return

    const handler = (e: MouseEvent) => {
      const mode = this.#opts.rightClick()
      // Do nothing and leave it to the default browser behavior
      if (mode === "menu") return

      // Do not show the menu
      e.preventDefault()
      e.stopPropagation()

      // When vim/tmux etc. are tracking the mouse, leave it to the application side (force paste by holding Shift)
      if (term.modes.mouseTrackingMode !== "none" && !e.shiftKey) return

      if (mode === "paste") {
        void this.paste()
      } else if (mode === "copyPaste") {
        if (term.hasSelection()) void this.copyAndClear()
        else void this.paste()
      }
    }

    el.addEventListener("contextmenu", handler, true)
    this.#disposables.push({
      dispose: () => el.removeEventListener("contextmenu", handler, true),
    })
  }

  dispose() {
    this.#disposables.forEach((d) => d.dispose())
    this.#disposables = []
    this.#term = undefined
  }
}
