import type { RightClickMode } from "./io/terminalIO"

export const TERMINAL_APPEARANCE_DEFAULTS = {
  "terminal.appearance.fontSize": 15 as number,
  "terminal.appearance.lineHeight": 1.2 as number,
  "terminal.appearance.cursorBlink": false as boolean,
  "terminal.appearance.showScrollbar": false as boolean,
  /** base64 image for terminal background */
  "terminal.appearance.backgroundImage": null as string | null,
} as const

export const TERMINAL_KEYBIND_DEFAULTS = {
  "terminal.keybind.ctrl-v-paste": true as boolean,
  "terminal.keybind.ctrl-c-copy": true as boolean,
} as const

export const TERMINAL_MOUSE_DEFAULTS = {
  "terminal.mouse.rightClick": "copyPaste" as RightClickMode,
} as const
