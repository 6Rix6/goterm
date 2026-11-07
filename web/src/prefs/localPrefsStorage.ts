// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { type PrefsStorage, type StorageChange } from "./prefsStorage"

export class LocalPrefsStorage implements PrefsStorage {
  #storage: Storage
  #observers: ((changes: Record<string, StorageChange>) => void)[]

  constructor(storage?: Storage) {
    this.#storage = storage ?? window.localStorage
    this.#observers = []

    window.addEventListener("storage", this.#onStorage.bind(this))
  }

  /**
   * Returns parsed JSON, or original value if JSON.parse fails.
   *
   * @param jsonString The string to parse.
   */
  #parseJson(jsonString: string | null): unknown {
    if (jsonString !== null) {
      try {
        return JSON.parse(jsonString)
      } catch (e) {
        // Ignore and return jsonString.
      }
    }
    return jsonString
  }

  /**
   * Called by the storage implementation when the storage is modified.
   *
   * @param e The setting that has changed.
   */
  #onStorage(e: StorageEvent) {
    if (e.storageArea != this.#storage || e.key == null) {
      return
    }

    const o: Record<string, StorageChange> = {}

    o[e.key] = {
      oldValue: this.#parseJson(e.oldValue),
      newValue: this.#parseJson(e.newValue),
    }

    for (let i = 0; i < this.#observers.length; i++) {
      this.#observers[i](o)
    }
  }

  /**
   * Register a function to observe storage changes.
   *
   * @param callback The function to invoke when the storage changes.
   * @override
   */
  addObserver(callback: (changes: Record<string, StorageChange>) => void) {
    this.#observers.push(callback)
  }

  /**
   * Unregister a change observer.
   *
   * @param callback A previously registered callback.
   * @override
   */
  removeObserver(callback: (changes: Record<string, StorageChange>) => void) {
    const i = this.#observers.indexOf(callback)
    if (i != -1) {
      this.#observers.splice(i, 1)
    }
  }

  /**
   * Delete everything in this storage.
   *
   * @override
   */
  clear(): void {
    this.#storage.clear()
  }

  /**
   * Return the current value of a storage item.
   *
   * @param key The key to look up.
   * @override
   */
  getItem(key: string): unknown {
    return this.getItems([key])[key]
  }

  /**
   * Fetch the values of multiple storage items.
   *
   * @param keys The keys to look up.  Pass null for all keys.
   * @override
   */
  getItems(keys: string[] | null): Record<string, unknown> {
    const rv: Record<string, unknown> = {}
    if (!keys) {
      keys = []
      for (let i = 0; i < this.#storage.length; i++) {
        const key = this.#storage.key(i)
        if (key != null) keys.push(key)
      }
    }

    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i]
      const value = this.#storage.getItem(key)
      if (typeof value == "string") {
        rv[key] = this.#parseJson(value)
      } else {
        keys.splice(i, 1)
      }
    }

    return rv
  }

  /**
   * Set a value in storage.
   *
   * @param key The key for the value to be stored.
   * @param value The value to be stored.  Anything that can be serialized
   *     with JSON is acceptable.
   * @override
   */
  setItem(key: string, value: unknown): void {
    this.setItems({ [key]: value })
  }

  /**
   * Set multiple values in storage.
   *
   * @param obj A map of key/values to set in storage.
   * @override
   */
  setItems(obj: Record<string, unknown>): void {
    for (const key in obj) {
      this.#storage.setItem(key, JSON.stringify(obj[key]))
    }
  }

  /**
   * Remove an item from storage.
   *
   * @param key The key to be removed.
   * @override
   */
  removeItem(key: string): void {
    this.removeItems([key])
  }

  /**
   * Remove multiple items from storage.
   *
   * @param keys The keys to be removed.
   * @override
   */
  removeItems(keys: string[]): void {
    for (let i = 0; i < keys.length; i++) {
      this.#storage.removeItem(keys[i])
    }
  }
}
