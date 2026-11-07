import { useContext, type Context } from "solid-js"

export function createContextHook<T>(context: Context<T | undefined>): () => T {
  return () => {
    const ctx = useContext(context)
    if (!ctx) throw new Error("context hook must be used within its provider.")
    return ctx
  }
}
