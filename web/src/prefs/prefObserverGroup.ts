import type { PreferenceManager, PreferenceObserver } from "./preferenceManager"
import type { Prefs } from "./schema"
import { getPref } from "./typed"

export class PrefObserverGroup {
  #manager: PreferenceManager
  #observers: { [K in keyof Prefs]?: PreferenceObserver } = {}

  constructor(manager: PreferenceManager) {
    this.#manager = manager
  }

  get<K extends keyof Prefs>(key: K) {
    return getPref(this.#manager, key)
  }

  observe<K extends keyof Prefs>(key: K, onChanged: (value: Prefs[K]) => void) {
    this.unobserve(key)

    const observer: PreferenceObserver = (value: unknown) => {
      onChanged(value as Prefs[K])
    }

    this.#manager.addObserver(key, observer)
    this.#observers[key] = observer
  }

  unobserve<K extends keyof Prefs>(key: K) {
    const observer = this.#observers[key]
    if (observer) {
      this.#manager.removeObserver(key, observer)
      delete this.#observers[key]
    }
  }

  dispose() {
    for (const [k, o] of Object.entries(this.#observers)) {
      this.#manager.removeObserver(k as keyof Prefs, o)
    }
    this.#observers = {}
  }
}
