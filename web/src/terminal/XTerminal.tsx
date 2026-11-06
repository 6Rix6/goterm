import { onCleanup, onMount } from 'solid-js'
import { Terminal as XTerm } from '@xterm/xterm'
import { Unicode11Addon } from '@xterm/addon-unicode11'

import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export type Status = 'connecting' | 'connected' | 'disconnected' | 'unauthorized'

type Props = {
  token: string
  onStatus?: (s: Status) => void
}

export default function Terminal(props: Props) {
  let container!: HTMLDivElement

  onMount(async () => {
    await Promise.all([
      document.fonts.load('15px "JetBrains Mono"'),
      document.fonts.load('bold 15px "JetBrains Mono"'),
    ])
    await document.fonts.ready

    const term = new XTerm({
      allowProposedApi: true,
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
      fontSize: 15,
    })

    const fit = new FitAddon()
    const unicode = new Unicode11Addon()

    term.loadAddon(fit)
    term.loadAddon(unicode)

    term.open(container)

    fit.fit()
    term.unicode.activeVersion = '11';


    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}/ws`)
    ws.binaryType = 'arraybuffer'
    const encoder = new TextEncoder()
    props.onStatus?.('connecting')

    ws.onopen = () => {
      fit.fit()
      ws.send(JSON.stringify({ type: 'init', token: props.token, cols: term.cols, rows: term.rows }))
      props.onStatus?.('connected')
      term.focus()
    }
    ws.onmessage = (e: MessageEvent<ArrayBuffer>) => term.write(new Uint8Array(e.data))
    ws.onclose = (e) => {
      props.onStatus?.(e.code === 1008 ? 'unauthorized' : 'disconnected')
      term.write('[disconnected]')
    }

    const data = term.onData((d) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(encoder.encode(d))
    })

    const ro = new ResizeObserver(() => {
      fit.fit()
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
      }
    })
    ro.observe(container)

    onCleanup(() => {
      ro.disconnect()
      data.dispose()
      ws.close()
      term.dispose()
    })
  })

  return <div ref={container} class="term" style={{ height: '100%' }} />
}
