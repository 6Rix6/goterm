import type { ThemeMode } from "./ThemeProvider"

export const THEME_DEFAULTS = {
  "theme.mode": "dark" as ThemeMode,
  "theme.seed": "#00add8" as string,
  "theme.backgroundImage": null as string | null,
} as const
