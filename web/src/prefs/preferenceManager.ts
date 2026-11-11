// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type { PrefsStorage, StorageChange } from "./prefsStorage"
import { assert, zpad, randomInt } from "../common/helpers"

/**
 * Used internally to indicate that the current value of the preference should
 * be taken from the default value defined with the preference.
 *
 * Equality tests against this value MUST use '===' or '!==' to be accurate.
 */
const DEFAULT_VALUE: unique symbol = Symbol("DEFAULT_VALUE")

/**
 * Callback invoked when a single preference changes.  It will receive the new
 * value, the name of the preference, and a reference to the PreferenceManager
 * as parameters.
 */
export type PreferenceObserver = (value: unknown, name: string, manager: PreferenceManager) => void

/**
 * Callback invoked when any preference changes.
 */
export type GlobalPreferenceObserver = (name: string, value: unknown) => void

/**
 * A function that will be used to generate instances of child preference
 * managers.  The factory function will receive the parent PreferenceManager
 * object and a unique id for the new child preferences.
 */
export type ChildFactory = (parent: PreferenceManager, id: string) => PreferenceManager

/**
 * An individual preference.
 *
 * These objects are managed by the PreferenceManager, you shouldn't need to
 * handle them directly.
 */
export class PreferenceRecord {
  /**
   * A local copy of the DEFAULT_VALUE constant to make it less verbose.
   */
  readonly DEFAULT_VALUE: typeof DEFAULT_VALUE = DEFAULT_VALUE

  name: string
  defaultValue: unknown
  currentValue: unknown = DEFAULT_VALUE
  observers: PreferenceObserver[] = []

  /**
   * @param name The name of the new preference (used for indexing).
   * @param defaultValue The default value for this preference.
   */
  constructor(name: string, defaultValue: unknown) {
    this.name = name
    this.defaultValue = defaultValue
  }

  /**
   * Register a callback to be invoked when this preference changes.
   *
   * @param observer The function to invoke.  It will receive the new value,
   *     the name of the preference, and a reference to the PreferenceManager
   *     as parameters.
   */
  addObserver(observer: PreferenceObserver) {
    this.observers.push(observer)
  }

  /**
   * Unregister an observer callback.
   *
   * @param observer A previously registered callback.
   */
  removeObserver(observer: PreferenceObserver) {
    const i = this.observers.indexOf(observer)
    if (i >= 0) {
      this.observers.splice(i, 1)
    }
  }

  /**
   * Fetch the value of this preference.
   *
   * @return The value for this preference.
   */
  get(): unknown {
    if (this.currentValue === this.DEFAULT_VALUE) {
      if (/^(string|number)$/.test(typeof this.defaultValue)) {
        return this.defaultValue
      }

      if (typeof this.defaultValue == "object") {
        // We want to return a COPY of the default value so that users can
        // modify the array or object without changing the default value.
        return JSON.parse(JSON.stringify(this.defaultValue))
      }

      return this.defaultValue
    }

    return this.currentValue
  }
}

/**
 * Entry in the JSON produced by exportAsJson for a child preference manager.
 */
interface ChildJson {
  id: string
  json: Record<string, unknown>
}

/**
 * These objects deal with persisting changes to stable storage and notifying
 * consumers when preferences change.
 *
 * It is intended that the backing store could be something other than HTML5
 * storage, but there aren't any use cases at the moment.  In the future there
 * may be a chrome api to store sync-able name/value pairs, and we'd want
 * that.
 */
export class PreferenceManager {
  /**
   * Used internally to indicate that the current value of the preference
   * should be taken from the default value defined with the preference.
   *
   * Equality tests against this value MUST use '===' or '!==' to be accurate.
   */
  readonly DEFAULT_VALUE: typeof DEFAULT_VALUE = DEFAULT_VALUE

  storage: PrefsStorage
  prefix: string
  trace = false

  #storageObserver: (changes: Record<string, StorageChange>) => void
  #isActive = false

  // Internal state for when we're doing a bulk import from JSON and we want
  // to elide redundant storage writes (for quota reasons).
  #isImportingJson = false

  #prefRecords: Record<string, PreferenceRecord> = {}
  #globalObservers: GlobalPreferenceObserver[] = []

  #childFactories: Record<string, ChildFactory> = {}

  // Map of list-name to {map of child pref managers}
  // As in...
  //
  //  this.#childLists = {
  //    'profile-ids': {
  //      'one': PreferenceManager,
  //      'two': PreferenceManager,
  //      ...
  //    },
  //
  //    'frob-ids': {
  //      ...
  //    }
  //  }
  #childLists: Record<string, Record<string, PreferenceManager>> = {}

  /**
   * @param storage The storage object to use as a backing store.
   * @param prefix The optional prefix to be used for all preference names.
   *     The '/' character should be used to separate levels of hierarchy,
   *     if you're going to have that kind of thing.  If provided, the prefix
   *     should start with a '/'.  If not provided, it defaults to '/'.
   */
  constructor(storage: PrefsStorage, prefix = "/") {
    this.storage = storage
    this.#storageObserver = this.#onStorageChange.bind(this)

    this.activate()

    if (!prefix.endsWith("/")) {
      prefix += "/"
    }

    this.prefix = prefix
  }

  /**
   * Stop this preference manager from tracking storage changes.
   *
   * Call this if you're going to swap out one preference manager for another so
   * that you don't get notified about irrelevant changes.
   */
  deactivate() {
    if (!this.#isActive) {
      throw new Error("Not activated")
    }

    this.#isActive = false
    this.storage.removeObserver(this.#storageObserver)
  }

  /**
   * Start tracking storage changes.
   *
   * If you previously deactivated this preference manager, you can reactivate
   * it with this method.  You don't need to call this at initialization time,
   * as it's automatically called as part of the constructor.
   */
  activate() {
    if (this.#isActive) {
      throw new Error("Already activated")
    }

    this.#isActive = true
    this.storage.addObserver(this.#storageObserver)
  }

  /**
   * Read the backing storage for these preferences.
   *
   * You should do this once at initialization time to prime the local cache
   * of preference values.  The preference manager will monitor the backing
   * storage for changes, so you should not need to call this more than once.
   *
   * This function recursively reads storage for all child preference managers
   * as well.
   */
  readStorage() {
    const keys = Object.keys(this.#prefRecords).map((el) => this.prefix + el)

    if (this.trace) {
      console.log("Preferences read: " + this.prefix)
    }

    const items = this.storage.getItems(keys)
    const prefixLength = this.prefix.length

    for (const key in items) {
      const value = items[key]
      const name = key.slice(prefixLength)
      const needSync =
        name in this.#childLists &&
        JSON.stringify(value) != JSON.stringify(this.#prefRecords[name].currentValue)

      this.#prefRecords[name].currentValue = value

      if (needSync) {
        this.syncChildList(name)
      }
    }
  }

  /**
   * Define a preference.
   *
   * This registers a name, default value, and onChange handler for a
   * preference.
   *
   * @param name The name of the preference.  This will be prefixed by the
   *     prefix of this PreferenceManager before written to local storage.
   * @param value The default value of this preference.  Anything that can be
   *     represented in JSON is a valid default value.
   * @param onChange A function to invoke when the preference changes.  It will
   *     receive the new value, the name of the preference, and a reference to
   *     the PreferenceManager as parameters.
   */
  definePreference(
    name: string,
    value: string | number | boolean | object | null,
    onChange?: PreferenceObserver,
  ) {
    let record = this.#prefRecords[name]
    if (record) {
      this.changeDefault(name, value)
    } else {
      record = this.#prefRecords[name] = new PreferenceRecord(name, value)
    }

    if (onChange) {
      record.addObserver(onChange)
    }
  }

  /**
   * Define multiple preferences with a single function call.
   *
   * @param defaults An array of 3-element arrays.  Each three element array
   *     should contain the [key, value, onChange] parameters for a preference.
   */
  definePreferences(
    defaults: Array<[string, string | number | boolean | object | null, PreferenceObserver?]>,
  ) {
    for (let i = 0; i < defaults.length; i++) {
      this.definePreference(defaults[i][0], defaults[i][1], defaults[i][2])
    }
  }

  /**
   * Define an ordered list of child preferences.
   *
   * Child preferences are different from just storing an array of JSON objects
   * in that each child is an instance of a preference manager.  This means you
   * can observe changes to individual child preferences, and get some
   * validation that you're not reading or writing to an undefined child
   * preference value.
   *
   * @param listName A name for the list of children.  This must be unique in
   *     this preference manager.  The listName will become a preference on
   *     this PreferenceManager used to store the ordered list of child ids.
   *     It is also used in get/add/remove operations to identify the list of
   *     children to operate on.
   * @param childFactory A function that will be used to generate instances of
   *     these children.  The factory function will receive the parent
   *     PreferenceManager object and a unique id for the new child
   *     preferences.
   */
  defineChildren(listName: string, childFactory: ChildFactory) {
    // Define a preference to hold the ordered list of child ids.
    this.definePreference(listName, [], this.#onChildListChange.bind(this, listName))
    this.#childFactories[listName] = childFactory
    this.#childLists[listName] = {}
  }

  /**
   * Register to observe preference changes.
   *
   * @param name The name of preference you wish to observe..
   * @param observer The callback.
   */
  addObserver(name: string, observer: PreferenceObserver) {
    if (!(name in this.#prefRecords)) {
      throw new Error(`Unknown preference: ${name}`)
    }

    this.#prefRecords[name].addObserver(observer)
  }

  /**
   * Register to observe preference changes.
   *
   * @param global A callback that will happen for every preference.  Pass null
   *     if you don't need one.
   * @param map A map of preference specific callbacks.  Pass null if you don't
   *     need any.
   */
  addObservers(
    global: GlobalPreferenceObserver | null,
    map: Record<string, PreferenceObserver> | null,
  ) {
    if (global && typeof global != "function") {
      throw new Error("Invalid param: globals")
    }

    if (global) {
      this.#globalObservers.push(global)
    }

    if (!map) {
      return
    }

    for (const name in map) {
      this.addObserver(name, map[name])
    }
  }

  /**
   * Remove preference observer.
   *
   * @param name The name of preference you wish to stop observing.
   * @param observer The observer to remove.
   */
  removeObserver(name: string, observer: PreferenceObserver) {
    if (!(name in this.#prefRecords)) {
      throw new Error(`Unknown preference: ${name}`)
    }

    this.#prefRecords[name].removeObserver(observer)
  }

  /**
   * Dispatch the change observers for all known preferences.
   *
   * It may be useful to call this after readStorage completes, in order to
   * get application state in sync with user preferences.
   *
   * This can be used if you've changed a preference manager out from under
   * a live object, for example when switching to a different prefix.
   */
  notifyAll() {
    for (const name in this.#prefRecords) {
      this.#notifyChange(name)
    }
  }

  /**
   * Notify the change observers for a given preference.
   *
   * @param name The name of the preference that changed.
   */
  #notifyChange(name: string) {
    const record = this.#prefRecords[name]
    if (!record) {
      throw new Error("Unknown preference: " + name)
    }

    const currentValue = record.get()

    for (let i = 0; i < this.#globalObservers.length; i++) {
      this.#globalObservers[i](name, currentValue)
    }

    for (let i = 0; i < record.observers.length; i++) {
      record.observers[i](currentValue, name, this)
    }
  }

  /**
   * Create a new child PreferenceManager for the given child list.
   *
   * The optional hint parameter is an opaque prefix added to the
   * auto-generated unique id for this child.  Your child factory can parse out
   * the prefix and use it.
   *
   * @param listName The child list to create the new instance from.
   * @param hint Optional hint to include in the child id.
   * @param id Optional id to override the generated id.
   * @return The new child preference manager.
   */
  createChild(listName: string, hint?: string | null, id?: string): PreferenceManager {
    const ids = this.get(listName) as string[]

    if (id) {
      if (ids.indexOf(id) != -1) {
        throw new Error("Duplicate child: " + listName + ": " + id)
      }
    } else {
      // Pick a random, unique 4-digit hex identifier for the new profile.
      while (!id || ids.indexOf(id) != -1) {
        id = randomInt(1, 0xffff).toString(16)
        id = zpad(id, 4)
        if (hint) {
          id = `${hint}:${id}`
        }
      }
    }

    const childManager = this.#childFactories[listName](this, id)
    childManager.trace = this.trace
    childManager.resetAll()

    this.#childLists[listName][id] = childManager

    ids.push(id)
    this.set(listName, ids, !this.#isImportingJson)

    return childManager
  }

  /**
   * Remove a child preferences instance.
   *
   * Removes a child preference manager and clears any preferences stored in
   * it.
   *
   * @param listName The name of the child list containing the child to
   *     remove.
   * @param id The child ID.
   */
  removeChild(listName: string, id: string) {
    const prefs = this.getChild(listName, id)
    prefs.resetAll()

    const ids = this.get(listName) as string[]
    const i = ids.indexOf(id)
    if (i != -1) {
      ids.splice(i, 1)
      this.set(listName, ids, !this.#isImportingJson)
    }

    delete this.#childLists[listName][id]
  }

  /**
   * Return a child PreferenceManager instance for a given id.
   *
   * If the child list or child id is not known this will return the specified
   * default value or throw an exception if no default value is provided.
   *
   * @param listName The child list to look in.
   * @param id The child ID.
   * @param defaultValue The value to return if the child is not found.
   * @return The specified child PreferenceManager.
   */
  getChild(listName: string, id: string, defaultValue?: PreferenceManager): PreferenceManager {
    if (!(listName in this.#childLists)) {
      throw new Error("Unknown child list: " + listName)
    }

    const childList = this.#childLists[listName]
    if (!(id in childList)) {
      if (defaultValue === undefined) {
        throw new Error('Unknown "' + listName + '" child: ' + id)
      }

      return defaultValue
    }

    return childList[id]
  }

  /**
   * Synchronize a list of child PreferenceManagers instances with the current
   * list stored in prefs.
   *
   * This will instantiate any missing managers and read current preference
   * values from storage.  Any active managers that no longer appear in
   * preferences will be deleted.
   *
   * @param listName The child list to synchronize.
   */
  syncChildList(listName: string) {
    // The list of child ids that we *should* have a manager for.
    const currentIds = this.get(listName) as string[]

    // The known managers at the start of the sync.  Any manager still in this
    // list at the end should be discarded.
    const oldIds = Object.keys(this.#childLists[listName])

    for (let i = 0; i < currentIds.length; i++) {
      const id = currentIds[i]

      const managerIndex = oldIds.indexOf(id)
      if (managerIndex >= 0) {
        oldIds.splice(managerIndex, 1)
      }

      if (!this.#childLists[listName][id]) {
        const childManager = this.#childFactories[listName](this, id)
        if (!childManager) {
          console.warn("Unable to restore child: " + listName + ": " + id)
          continue
        }

        childManager.trace = this.trace
        this.#childLists[listName][id] = childManager
        childManager.readStorage()
      }
    }

    for (let i = 0; i < oldIds.length; i++) {
      delete this.#childLists[listName][oldIds[i]]
    }
  }

  /**
   * Reset a preference to its default state.
   *
   * This will dispatch the onChange handler if the preference value actually
   * changes.
   *
   * @param name The preference to reset.
   */
  reset(name: string) {
    const record = this.#prefRecords[name]
    if (!record) {
      throw new Error("Unknown preference: " + name)
    }

    this.storage.removeItem(this.prefix + name)

    if (record.currentValue !== this.DEFAULT_VALUE) {
      record.currentValue = this.DEFAULT_VALUE
      this.#notifyChange(name)
    }
  }

  /**
   * Reset all preferences back to their default state.
   */
  resetAll() {
    const changed: string[] = []

    for (const listName in this.#childLists) {
      const childList = this.#childLists[listName]
      for (const id in childList) {
        childList[id].resetAll()
      }
    }

    for (const name in this.#prefRecords) {
      if (this.#prefRecords[name].currentValue !== this.DEFAULT_VALUE) {
        this.#prefRecords[name].currentValue = this.DEFAULT_VALUE
        changed.push(name)
      }
    }

    const keys = Object.keys(this.#prefRecords).map((el) => this.prefix + el)

    this.storage.removeItems(keys)

    changed.forEach((name) => this.#notifyChange(name))
  }

  /**
   * Return true if two values should be considered not-equal.
   *
   * If both values are the same scalar type and compare equal this function
   * returns false (no difference), otherwise return true.
   *
   * This is used in places where we want to check if a preference has changed.
   * Rather than take the time to compare complex values we just consider them
   * to always be different.
   *
   * @param a A value to compare.
   * @param b A value to compare.
   * @return Whether the two are not equal.
   */
  diff(a: unknown, b: unknown): boolean {
    // If the types are different.
    if (typeof a !== typeof b) {
      return true
    }

    // Or if the type is not a simple primitive one.
    if (!/^(undefined|boolean|number|string)$/.test(typeof a)) {
      // Special case the null object.
      if (a === null && b === null) {
        return false
      } else {
        return true
      }
    }

    // Do a normal compare for primitive types.
    return a !== b
  }

  /**
   * Change the default value of a preference.
   *
   * This is useful when subclassing preference managers.
   *
   * The function does not alter the current value of the preference, unless
   * it has the old default value.  When that happens, the change observers
   * will be notified.
   *
   * @param name The name of the parameter to change.
   * @param newValue The new default value for the preference.
   */
  changeDefault(name: string, newValue: unknown) {
    const record = this.#prefRecords[name]
    if (!record) {
      throw new Error("Unknown preference: " + name)
    }

    if (!this.diff(record.defaultValue, newValue)) {
      // Default value hasn't changed.
      return
    }

    if (record.currentValue !== this.DEFAULT_VALUE) {
      // This pref has a specific value, just change the default and we're done.
      record.defaultValue = newValue
      return
    }

    record.defaultValue = newValue

    this.#notifyChange(name)
  }

  /**
   * Change the default value of multiple preferences.
   *
   * @param map A map of name -> value pairs specifying the new default
   *     values.
   */
  changeDefaults(map: Record<string, unknown>) {
    for (const key in map) {
      this.changeDefault(key, map[key])
    }
  }

  /**
   * Set a preference to a specific value.
   *
   * This will dispatch the onChange handler if the preference value actually
   * changes.
   *
   * @param name The preference to set.
   * @param newValue The value to set.  Anything that can be represented in
   *     JSON is a valid value.
   * @param onComplete Callback when the set call completes.
   * @param saveToStorage Whether to commit the change to the backing storage
   *     or only the in-memory record copy.
   * @return Promise which resolves once all observers are notified.
   */
  set(name: string, newValue: unknown, saveToStorage = true): void {
    const record = this.#prefRecords[name]
    if (!record) {
      throw new Error("Unknown preference: " + name)
    }

    const oldValue = record.get()

    if (!this.diff(oldValue, newValue)) {
      return
    }

    if (this.diff(record.defaultValue, newValue)) {
      record.currentValue = newValue
      if (saveToStorage) {
        this.storage.setItem(this.prefix + name, newValue)
      }
    } else {
      record.currentValue = this.DEFAULT_VALUE
      if (saveToStorage) {
        this.storage.removeItem(this.prefix + name)
      }
    }

    // We need to manually send out the notification on this instance.  If we
    // The storage event won't fire a notification because we've already changed
    // the currentValue, so it won't see a difference.  If we delayed changing
    // currentValue until the storage event, a pref read immediately after a
    // write would return the previous value.
    this.#notifyChange(name)
  }

  /**
   * Get the value of a preference.
   *
   * @param name The preference to get.
   * @return The preference's value.
   */
  get(name: string): unknown {
    const record = this.#prefRecords[name]
    if (!record) {
      throw new Error("Unknown preference: " + name)
    }

    return record.get()
  }

  /**
   * Get the default value of a preference.
   *
   * @param name The preference to get.
   * @return The preference's default value.
   */
  getDefault(name: string): unknown {
    const record = this.#prefRecords[name]
    if (!record) {
      throw new Error(`Unknown preference: ${name}`)
    }

    return record.defaultValue
  }

  /**
   * Get the boolean value of a preference.
   *
   * @param name The preference to get.
   */
  getBoolean(name: string): boolean {
    const result = this.get(name)
    assert(typeof result == "boolean")
    return result
  }

  /**
   * Get the number value of a preference.
   *
   * @param name The preference to get.
   */
  getNumber(name: string): number {
    const result = this.get(name)
    assert(typeof result == "number")
    return result
  }

  /**
   * Get the string value of a preference.
   *
   * @param name The preference to get.
   */
  getString(name: string): string {
    const result = this.get(name)
    assert(typeof result == "string")
    return result
  }

  /**
   * Return all non-default preferences as a JSON object.
   *
   * This includes any nested preference managers as well.
   *
   * @return The JSON preferences.
   */
  exportAsJson(): Record<string, unknown> {
    const rv: Record<string, unknown> = {}

    for (const name in this.#prefRecords) {
      if (name in this.#childLists) {
        const children: ChildJson[] = []
        rv[name] = children
        const childIds = this.get(name) as string[]
        for (let i = 0; i < childIds.length; i++) {
          const id = childIds[i]
          children.push({ id: id, json: this.getChild(name, id).exportAsJson() })
        }
      } else {
        const record = this.#prefRecords[name]
        if (record.currentValue !== this.DEFAULT_VALUE) {
          rv[name] = record.currentValue
        }
      }
    }

    return rv
  }

  /**
   * Import a JSON blob of preferences previously generated with exportAsJson.
   *
   * This will create nested preference managers as well.
   *
   * @param json The JSON settings to import.
   * @param onComplete Callback when all imports have finished.
   */
  importFromJson(json: Record<string, unknown>, onComplete?: () => void) {
    this.#isImportingJson = true

    let pendingWrites = 0
    const onWriteStorage = () => {
      if (--pendingWrites < 1) {
        if (onComplete) {
          onComplete()
        }

        // We've delayed updates to the child arrays, so flush them now.
        for (const name in json) {
          if (name in this.#childLists) {
            this.set(name, this.get(name))
          }
        }

        this.#isImportingJson = false
      }
    }

    for (const name in json) {
      if (name in this.#childLists) {
        const childList = json[name] as ChildJson[]
        for (let i = 0; i < childList.length; i++) {
          const id = childList[i].id

          let childPrefManager = this.#childLists[name][id]
          if (!childPrefManager) {
            childPrefManager = this.createChild(name, null, id)
          }

          childPrefManager.importFromJson(childList[i].json, onWriteStorage)
          pendingWrites++
        }
      } else {
        // The set is synchronous.
        this.set(name, json[name])
      }
    }

    // If we didn't update any children, no async work has been queued, so make
    // the completion callback directly.
    if (pendingWrites == 0 && onComplete) {
      onComplete()
    }
  }

  /**
   * Called when one of the child list preferences changes.
   *
   * @param listName The child list to synchronize.
   */
  #onChildListChange(listName: string) {
    this.syncChildList(listName)
  }

  /**
   * Called when a key in the storage changes.
   *
   * @param map Dictionary of changed settings.
   */
  #onStorageChange(map: Record<string, StorageChange>) {
    for (const key in map) {
      if (this.prefix) {
        if (key.lastIndexOf(this.prefix, 0) != 0) {
          continue
        }
      }

      const name = key.slice(this.prefix.length)

      if (!(name in this.#prefRecords)) {
        // Sometimes we'll get notified about prefs that are no longer defined.
        continue
      }

      const record = this.#prefRecords[name]

      const newValue = map[key].newValue
      let currentValue = record.currentValue
      if (currentValue === record.DEFAULT_VALUE) {
        currentValue = undefined
      }

      if (this.diff(currentValue, newValue)) {
        if (typeof newValue == "undefined" || newValue === null) {
          record.currentValue = record.DEFAULT_VALUE
        } else {
          record.currentValue = newValue
        }

        this.#notifyChange(name)
      }
    }
  }
}
