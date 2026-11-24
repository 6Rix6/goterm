import type { Disposable } from "./view/terminalView"

export class WindowTitleManager implements Disposable {
  #defaultTitle: string
  #termTitleChange: Disposable
  #sessTitleChange: Disposable

  #termTitle: string | undefined
  #sessTitle: string | undefined

  get title(): string {
    return [this.#termTitle, this.#sessTitle].filter(Boolean).join(" | ") || this.#defaultTitle
  }

  constructor(
    onTerminalTitleChange: (cb: (title: string) => void) => Disposable,
    onSessionTitleChange: (cb: (title: string | undefined) => void) => Disposable,
    defaultTitle: string = "Terminal",
  ) {
    this.#defaultTitle = defaultTitle
    this.#termTitleChange = onTerminalTitleChange((t) => {
      this.#termTitle = this.#cleanText(t)
      this.#setTitle()
    })
    this.#sessTitleChange = onSessionTitleChange((t) => {
      this.#sessTitle = this.#cleanText(t)
      this.#setTitle()
    })
    this.#setTitle()
  }

  #cleanText(text: string | undefined): string | undefined {
    if (!text) return

    const cleaned = text.trim()
    if (cleaned.length === 0) return
    else return cleaned
  }

  #setTitle() {
    document.title = this.title
  }

  dispose() {
    this.#sessTitleChange.dispose()
    this.#termTitleChange.dispose()
  }
}
