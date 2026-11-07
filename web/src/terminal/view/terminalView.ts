export type TerminalSize = { cols: number; rows: number }

export interface Disposable {
  dispose(): void
}

export type TerminalViewOptions = {
  fontFamily?: string
  fontSize?: number
}

export abstract class TerminalView {
  /** Mounts to the DOM. Preparations necessary for rendering, such as loading fonts, are also performed here */
  abstract mount(container: HTMLElement): Promise<void>

  /** Writes output from the server */
  abstract write(data: Uint8Array | string): void

  abstract focus(): void

  /** Resizes to fit the container size and returns the resulting cols/rows */
  abstract fit(): TerminalSize

  /** Subscribes to user input */
  abstract onInput(cb: (data: string) => void): Disposable

  abstract dispose(): void
}
