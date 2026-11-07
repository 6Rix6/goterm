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
