import { onCleanup, onMount } from "solid-js"
import { TerminalSocket, type Status } from "./terminalSocket"
import { TerminalView, type Disposable } from "./view/terminalView"
import { XtermView } from "./view/xtermlView"

export type { Status }

type Props = {
  token: string
  onStatus?: (s: Status) => void
  createView?: () => TerminalView
}

export default function Terminal(props: Props) {
  let container!: HTMLDivElement

  onMount(() => {
    const view = props.createView?.() ?? new XtermView()
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
    window.view = view;

    void (async () => {
      await view.mount(container)
      if (disposed) return

      socket = new TerminalSocket({
        token: props.token,
        getSize: () => view.fit(),
        onOpen: () => view.focus(),
        onData: (d) => view.write(d),
        onStatus: (s) => {
          props.onStatus?.(s)
          if (s === "disconnected" || s === "unauthorized") view.write("[disconnected]")
        },
      })

      input = view.onInput((d) => socket!.sendInput(d))

      ro = new ResizeObserver(() => {
        const { cols, rows } = view.fit()
        socket!.sendResize(cols, rows)
      })
      ro.observe(container)
    })()
  })

  return <div ref={container} class="term" style={{ height: "100%" }} />
}
