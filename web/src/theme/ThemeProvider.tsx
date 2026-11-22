import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Accessor,
  type ParentProps,
} from "solid-js"
import {
  applyTheme,
  argbFromHex,
  hexFromArgb,
  sourceColorFromImage,
  themeFromSourceColor,
  type Theme,
} from "@material/material-color-utilities"
import { createContextHook } from "../common/helpers"
import { usePref } from "../prefs/PrefsProvider"
import { THEME_DEFAULTS } from "./prefs"

export type ThemeMode = "light" | "dark" | "system"

export interface ThemeContextValue {
  /** current seed color (#rrggbb) */
  seed: Accessor<string>
  setSeed: (hex: string) => void
  /** Extract and set the seed color from the image */
  setSeedFromImage: (img: HTMLImageElement) => Promise<void>
  /** "light" | "dark" | "system" */
  mode: Accessor<ThemeMode>
  setMode: (mode: ThemeMode) => void
  /** Whether it is actually dark as a result of resolving the system */
  isDark: Accessor<boolean>
  /** generated theme (schemes.light / schemes.dark / palettes) */
  theme: Accessor<Theme>
}

const ThemeContext = createContext<ThemeContextValue>()

export const useTheme = createContextHook(ThemeContext)

export interface ThemeProviderProps {
  target?: HTMLElement
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function ThemeProvider(props: ParentProps<ThemeProviderProps>) {
  const [mode, setMode] = usePref("theme.mode")
  const [seed, _setSeed] = usePref("theme.seed")
  const [systemDark, setSystemDark] = createSignal(false)

  onMount(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemDark(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener("change", onChange)
    onCleanup(() => mq.removeEventListener("change", onChange))
  })

  const isDark = createMemo(() => (mode() === "system" ? systemDark() : mode() === "dark"))

  const theme = createMemo(() => {
    const hex = HEX_RE.test(seed()) ? seed() : THEME_DEFAULTS["theme.seed"]
    return themeFromSourceColor(argbFromHex(hex))
  })

  // apply css variables (--md-sys-color-*)
  createEffect(() => {
    const t = theme()
    const dark = isDark()
    const el = props.target ?? document.documentElement

    applyTheme(t, { target: el, dark })
    applyMissingColors(t, { target: el, dark })

    el.style.colorScheme = dark ? "dark" : "light"
    el.dataset.theme = dark ? "dark" : "light"
  })

  const setSeed = (hex: string) => {
    if (!HEX_RE.test(hex)) return
    _setSeed(hex)
  }

  const setSeedFromImage = async (img: HTMLImageElement) => {
    const argb = await sourceColorFromImage(img)
    setSeed(hexFromArgb(argb))
  }

  return (
    <ThemeContext.Provider
      value={{ seed, setSeed, setSeedFromImage, mode, setMode, isDark, theme }}
    >
      {props.children}
    </ThemeContext.Provider>
  )
}

export const applyMissingColors = (
  theme: Theme,
  options?: { dark?: boolean; target?: HTMLElement },
): void => {
  const target = options?.target ?? document.body
  const dark = options?.dark ?? false

  const { primary, secondary, tertiary, neutral } = theme.palettes

  const lightColors = new Map<string, string>([
    ["--md-sys-color-primary-fixed", hexFromArgb(primary.tone(90))],
    ["--md-sys-color-primary-fixed-dim", hexFromArgb(neutral.tone(80))],
    ["--md-sys-color-on-primary-fixed", hexFromArgb(primary.tone(10))],
    ["--md-sys-color-on-primary-fixed-variant", hexFromArgb(primary.tone(30))],
    ["--md-sys-color-secondary-fixed", hexFromArgb(secondary.tone(90))],
    ["--md-sys-color-secondary-fixed-dim", hexFromArgb(secondary.tone(80))],
    ["--md-sys-color-on-secondary-fixed", hexFromArgb(secondary.tone(10))],
    ["--md-sys-color-on-secondary-fixed-variant", hexFromArgb(secondary.tone(30))],
    ["--md-sys-color-tertiary-fixed", hexFromArgb(tertiary.tone(90))],
    ["--md-sys-color-tertiary-fixed-dim", hexFromArgb(tertiary.tone(80))],
    ["--md-sys-color-on-tertiary-fixed", hexFromArgb(tertiary.tone(10))],
    ["--md-sys-color-on-tertiary-fixed-variant", hexFromArgb(tertiary.tone(30))],
    ["--md-sys-color-surface-dim", hexFromArgb(neutral.tone(87))],
    ["--md-sys-color-surface-bright", hexFromArgb(neutral.tone(98))],
    ["--md-sys-color-surface-container-lowest", hexFromArgb(neutral.tone(100))],
    ["--md-sys-color-surface-container-low", hexFromArgb(neutral.tone(96))],
    ["--md-sys-color-surface-container", hexFromArgb(neutral.tone(94))],
    ["--md-sys-color-surface-container-high", hexFromArgb(neutral.tone(92))],
    ["--md-sys-color-surface-container-highest", hexFromArgb(neutral.tone(90))],
  ])

  const darkColors = new Map<string, string>([
    ["--md-sys-color-surface-dim", hexFromArgb(neutral.tone(6))],
    ["--md-sys-color-surface-bright", hexFromArgb(neutral.tone(24))],
    ["--md-sys-color-surface-container-lowest", hexFromArgb(neutral.tone(4))],
    ["--md-sys-color-surface-container-low", hexFromArgb(neutral.tone(10))],
    ["--md-sys-color-surface-container", hexFromArgb(neutral.tone(12))],
    ["--md-sys-color-surface-container-high", hexFromArgb(neutral.tone(17))],
    ["--md-sys-color-surface-container-highest", hexFromArgb(neutral.tone(22))],
  ])

  const colors = !dark ? lightColors : new Map([...lightColors.entries(), ...darkColors.entries()])

  for (const [token, color] of colors) {
    target.style.setProperty(token, color)
  }
}
