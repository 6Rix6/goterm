import { onCleanup, onMount } from "solid-js"
import { TerminalSocket, type Status } from "./terminalSocket"
import { TerminalView, type Disposable } from "./view/terminalView"
import { delayedScheduler } from "../common/helpers"
import { usePref } from "../prefs/PrefsProvider"
import { WindowTitleManager } from "./windowTitleManager"

export type { Status }

type Props = {
  token: string
  sessionId?: string
  onStatus?: (s: Status) => void
  createView: () => TerminalView
}

export function Terminal(props: Props) {
  const [bgImage] = usePref("terminal.appearance.backgroundImage")
  let container!: HTMLDivElement

  onMount(() => {
    const view = props.createView()
    let socket: TerminalSocket | undefined
    let input: Disposable | undefined
    let tm: WindowTitleManager | undefined
    let ro: ResizeObserver | undefined
    let disposed = false

    onCleanup(() => {
      disposed = true
      ro?.disconnect()
      input?.dispose()
      tm?.dispose()
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
      tm = new WindowTitleManager(
        (cb) => view.onTitleChange(cb),
        (cb) => socket!.onTitleChange(cb),
      )

      const scheduleFit = delayedScheduler(() => {
        const { cols, rows } = view.fit()
        socket!.sendResize(cols, rows)
      }, 250)

      ro = new ResizeObserver(() => scheduleFit())
      ro?.observe(container)
    })()
  })

  return (
    <div
      style={{
        "background-image": bgImage() ? `url(${bgImage()})` : undefined,
        "background-size": "cover",
        "background-position": "center",
      }}
      ref={container}
      class="term"
    />
  )
}
