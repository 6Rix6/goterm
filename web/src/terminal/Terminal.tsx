import { onCleanup, onMount } from "solid-js"
import { TerminalSocket, type Status } from "./terminalSocket"
import { TerminalView, type Disposable } from "./view/terminalView"
import { delayedScheduler } from "../common/helpers"

export type { Status }

type Props = {
  token: string
  sessionId?: string
  onStatus?: (s: Status) => void
  createView: () => TerminalView
}

export function Terminal(props: Props) {
  let container!: HTMLDivElement

  onMount(() => {
    const view = props.createView()
    let socket: TerminalSocket | undefined
    let input: Disposable | undefined
    let ro: ResizeObserver | undefined
    let disposed = false

    onCleanup(() => {
      disposed = true
      ro?.disconnect()
      input?.dispose()
      socket?.close()
      view.dispose()
    })

    // @ts-ignore
    window.view = view

    void (async () => {
      await view.mount(container)
      if (disposed) return

      socket = new TerminalSocket({
        token: props.token,
        sessionId: props.sessionId,
        getSize: () => view.fit(),
        onOpen: () => view.focus(),
        onData: (d) => view.write(d),
        onStatus: (s) => props.onStatus?.(s),
      })

      input = view.onInput((d) => socket!.sendInput(d))

      const scheduleFit = delayedScheduler(() => {
        const { cols, rows } = view.fit()
        socket!.sendResize(cols, rows)
      }, 250)

      ro = new ResizeObserver(() => scheduleFit())
      ro?.observe(container)
    })()
  })

  return <div ref={container} class="term" />
}
