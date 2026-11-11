import { useContext, type Context } from "solid-js"

export function createContextHook<T>(context: Context<T | undefined>): () => T {
  return () => {
    const ctx = useContext(context)
    if (!ctx) throw new Error("context hook must be used within its provider.")
    return ctx
  }
}

// Copyright 2020 The ChromiumOS Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Return a new "scheduler" function. When the function is called, it will
 * schedule the `callback` to be called after `delay` time. It also returns a
 * promise, which is fulfilled after the callback is called. The function does
 * nothing if it is called again and the last one hasn't timed out yet.
 *
 * @param callback
 * @param delay
 * @return The schedule function.
 */
export function delayedScheduler<T = void>(callback: () => T, delay: number): () => Promise<T> {
  let donePromise: Promise<T> | null = null
  return () => {
    if (!donePromise) {
      donePromise = new Promise((resolve) => {
        setTimeout(() => {
          donePromise = null
          resolve(callback())
        }, delay)
      })
    }
    return donePromise
  }
}

/**
 * Verify |condition| is truthy else throw Error.
 *
 * @param condition A condition to check.
 */
export function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg)
}

/**
 * Get a random integer in a range (inclusive).
 *
 * @param min The lowest integer in the range.
 * @param max The highest integer in the range.
 * @return A random number between min & max.
 */
export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Left pad a number to a given length with leading zeros.
 *
 * @param number The number to pad.
 * @param length The desired length.
 * @return The padded number as a string.
 */
export function zpad(number: string | number, length: number) {
  return String(number).padStart(length, "0")
}
