import { Show } from "solid-js"
import { XtermView } from "../../terminal/view/xtermlView"
import { Terminal } from "../../terminal/Terminal"
import { TokenManager } from "../../auth/tokenManager"
import { usePrefs } from "../../prefs/PrefsProvider"

export const SESSION_ID_KEY = "session"

export function TerminalPage() {
  const token = TokenManager.get()
  const prefsManager = usePrefs()
  const params = new URLSearchParams(location.search)
  const id = params.get(SESSION_ID_KEY) ?? undefined

  return (
    <Show when={token} fallback={<p class="msg">No token</p>}>
      <Terminal
        token={token!}
        sessionId={id}
        createView={() => new XtermView(prefsManager, { webgl: true })}
      />
    </Show>
  )
}
