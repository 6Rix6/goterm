import { Show } from 'solid-js'
import Terminal from './terminal/XTerminal.tsx'
import { TokenManager } from './auth/tokenManager'

export function App() {
  const token = TokenManager.get()

  return (
    <Show when={token} fallback={<p class="msg">No token</p>}>
      <Terminal token={token!} />
    </Show>
  )
}

export function Home() {
  return (
    <div>
      <p style={{ "font-size": "60px", color: "white" }}>Home</p>
      <a href='terminal' target='_blank'>terminal</a>
    </div>
  )
}
