import { TokenManager } from "../auth/tokenManager"
import { SessionManager } from "../session/sessionManager"
import { useTheme, type ThemeMode } from "../theme/ThemeProvider"
import { For, ErrorBoundary, Suspense, Show } from "solid-js"
import { SESSION_ID_KEY } from "./TerminalPage"

export function HomePage() {
  const token = TokenManager.get()
  return (
    <div>
      <p style={{ "font-size": "60px", color: "white" }}>Home</p>
      <a href="terminal" target="_blank">
        terminal
      </a>
      <Settings />
      <Show when={token}>
        <SessionListWrapper token={token!} />
      </Show>
    </div>
  )
}

function Settings() {
  const { seed, setSeed, mode, setMode } = useTheme()
  return (
    <>
      <input type="color" value={seed()} onInput={(e) => setSeed(e.currentTarget.value)} />
      <select value={mode()} onChange={(e) => setMode(e.currentTarget.value as ThemeMode)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </>
  )
}

function SessionListWrapper(props: { token: string }) {
  const manager = new SessionManager(props.token)

  return (
    <ErrorBoundary fallback={(e) => <p>Error: {String(e)}</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        <button onClick={() => manager.refresh()}>Refresh</button>
        <For each={manager.sessions}>
          {(s) => (
            <div>
              {s.id.slice(0, 8)} {s.createdAt.toLocaleString()}
              <Show when={s.attached}> (attached)</Show>
              <button onClick={() => (s.pinned ? manager.unpin(s.id) : manager.pin(s.id))}>
                {s.pinned ? "Unpin" : "Pin"}
              </button>
              <button onClick={() => manager.delete(s.id)}>Delete</button>
              <a href={`/terminal?${SESSION_ID_KEY}=${s.id}`} target="_blank">
                open
              </a>
            </div>
          )}
        </For>
      </Suspense>
    </ErrorBoundary>
  )
}
