import { createContext, createSignal, onCleanup, type ParentProps } from "solid-js"
import { PreferenceManager } from "./preferenceManager"
import { LocalPrefsStorage } from "./localPrefsStorage"
import { createContextHook } from "../common/helpers"
import { defaults, type Prefs } from "./schema"

export interface PrefsProviderProps {
  storage?: Storage
  prefix?: string
}

const PrefsContext = createContext<PreferenceManager>()

export const usePrefs = createContextHook(PrefsContext)

export function usePref<K extends keyof Prefs>(key: K) {
  const m = usePrefs()
  const [value, setValue] = createSignal(m.get(key) as Prefs[K])

  const observer = (v: unknown) => setValue(() => v as Prefs[K])
  m.addObserver(key, observer)
  onCleanup(() => m.removeObserver(key, observer))

  return [value, (v: Prefs[K]) => m.set(key, v)] as const
}

export function PrefsProvider(props: ParentProps<PrefsProviderProps>) {
  const storage = new LocalPrefsStorage(props.storage)
  const prefs = new PreferenceManager(storage, props.prefix)

  for (const [key, value] of Object.entries(defaults)) {
    prefs.definePreference(key, value)
  }

  prefs.readStorage()
  prefs.notifyAll()

  onCleanup(() => prefs.deactivate())

  return <PrefsContext.Provider value={prefs}>{props.children}</PrefsContext.Provider>
}
