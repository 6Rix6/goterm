import type { Disposable } from "../view/terminalView.ts"

export type KeyCombo = {
  key: string // e.key
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
}

export type KeyBinding = {
  combo: KeyCombo
  /** Returns false to skip this binding (= passes it to xterm) */
  when?: () => boolean
  /** Optional. If omitted, it just "consumes" the event */
  run?: (e: KeyboardEvent) => void
  /** default: true. false only when you want to leave it to native paste */
  preventDefault?: boolean
}

const matches = (e: KeyboardEvent, c: KeyCombo) =>
  e.key.toLowerCase() === c.key.toLowerCase() &&
  e.ctrlKey === !!c.ctrl &&
  e.shiftKey === !!c.shift &&
  e.altKey === !!c.alt &&
  e.metaKey === !!c.meta

export class KeybindingManager {
  #bindings: KeyBinding[] = []

  add(binding: KeyBinding): Disposable {
    this.#bindings.push(binding)
    return {
      dispose: () => {
        this.#bindings = this.#bindings.filter((b) => b !== binding)
      },
    }
  }

  handle = (e: KeyboardEvent): boolean => {
    if (e.type !== "keydown") return true
    if (e.isComposing || e.keyCode === 229) return true

    for (let i = this.#bindings.length - 1; i >= 0; i--) {
      const b = this.#bindings[i]
      if (!matches(e, b.combo)) continue
      if (b.when && !b.when()) continue

      if (b.preventDefault !== false) e.preventDefault()
      b.run?.(e)
      return false
    }
    return true
  }
}
