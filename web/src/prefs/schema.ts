import {
  TERMINAL_APPEARANCE_DEFAULTS,
  TERMINAL_KEYBIND_DEFAULTS,
  TERMINAL_MOUSE_DEFAULTS,
} from "../terminal/prefs"
import { THEME_DEFAULTS } from "../theme/prefs"

export const defaults = {
  ...THEME_DEFAULTS,
  ...TERMINAL_APPEARANCE_DEFAULTS,
  ...TERMINAL_KEYBIND_DEFAULTS,
  ...TERMINAL_MOUSE_DEFAULTS,
}
export type Prefs = typeof defaults
