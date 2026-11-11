import { TERMINAL_DEFAULTS } from "../terminal/prefs"
import { THEME_DEFAULTS } from "../theme/prefs"

export const defaults = { ...THEME_DEFAULTS, ...TERMINAL_DEFAULTS }
export type Prefs = typeof defaults
