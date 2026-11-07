// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * A single change to a storage item, modeled after Chrome's StorageChange.
 */
export interface StorageChange {
  oldValue?: unknown
  newValue?: unknown
}

/**
 * Namespace for implementations of persistent, possibly cloud-backed
 * storage.
 */
export interface PrefsStorage {
  /**
   * Register a function to observe storage changes.
   *
   * @param callback The function to invoke when the storage changes.
   */
  addObserver(callback: (changes: Record<string, StorageChange>) => void): void

  /**
   * Unregister a change observer.
   *
   * @param callback A previously registered callback.
   */
  removeObserver(callback: (changes: Record<string, StorageChange>) => void): void

  /**
   * Delete everything in this storage.
   */
  clear(): void

  /**
   * Return the current value of a storage item.
   *
   * @param key The key to look up.
   * @return The requested item.
   */
  getItem(key: string): unknown

  /**
   * Fetch the values of multiple storage items.
   *
   * @param keys The keys to look up.  Pass null for all keys.
   * @return The requested items.
   */
  getItems(keys: string[] | null): Record<string, unknown>

  /**
   * Set a value in storage.
   *
   * @param key The key for the value to be stored.
   * @param value The value to be stored.  Anything that can be serialized
   *     with JSON is acceptable.
   */
  setItem(key: string, value: unknown): void

  /**
   * Set multiple values in storage.
   *
   * @param obj A map of key/values to set in storage.
   */
  setItems(obj: Record<string, unknown>): void

  /**
   * Remove an item from storage.
   *
   * @param key The key to be removed.
   */
  removeItem(key: string): void

  /**
   * Remove multiple items from storage.
   *
   * @param keys The keys to be removed.
   */
  removeItems(keys: string[]): void
}

/**
 * Create the set of changes between two states.
 *
 * This is used to synthesize the equivalent of Chrome's StorageEvent for use
 * by our stub APIs and testsuites.  We expect Chrome's StorageEvent to also
 * match the web's Storage API & window.onstorage events.
 *
 * @param oldStorage The old storage state.
 * @param newStorage The new storage state.
 * @return The changes.
 */
export function generateStorageChanges(
  oldStorage: Record<string, unknown>,
  newStorage: Record<string, unknown>,
): Record<string, StorageChange> {
  const changes: Record<string, StorageChange> = {}
  const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key)

  // See what's changed.
  for (const key in newStorage) {
    const newValue = newStorage[key]
    if (has(oldStorage, key)) {
      // Key has been updated.
      const oldValue = oldStorage[key]
      if (oldValue !== newValue) {
        changes[key] = { oldValue, newValue }
      }
    } else {
      // Key has been added.
      changes[key] = { newValue }
    }
  }

  // See what's deleted.
  for (const key in oldStorage) {
    if (!has(newStorage, key)) {
      changes[key] = { oldValue: oldStorage[key] }
    }
  }

  return changes
}
