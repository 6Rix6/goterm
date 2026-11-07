import type { PreferenceManager } from "./preferenceManager"
import type { Prefs } from "./schema"

export function getPref<K extends keyof Prefs>(m: PreferenceManager, key: K) {
  return m.get(key) as Prefs[K]
}
export function setPref<K extends keyof Prefs>(m: PreferenceManager, key: K, v: Prefs[K]) {
  m.set(key, v)
}
