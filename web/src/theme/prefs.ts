import type { ThemeMode } from "./ThemeProvider"

export const THEME_DEFAULTS = {
  "theme.mode": "dark" as ThemeMode,
  "theme.seed": "#6750a4" as string,
  "theme.backgroundImage": null as string | null,
} as const
