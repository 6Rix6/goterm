import { Show } from "solid-js"
import { XtermView } from "../terminal/view/xtermlView"
import Terminal from "../terminal/Terminal"
import { TokenManager } from "../auth/tokenManager"

export function TerminalPage() {
  const token = TokenManager.get()

  return (
    <Show when={token} fallback={<p class="msg">No token</p>}>
      <Terminal token={token!} createView={() => new XtermView({ webgl: false })} />
    </Show>
  )
}
