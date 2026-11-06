// import { registerSW } from 'virtual:pwa-register'
// import { Terminal } from '@xterm/xterm'
// import { FitAddon } from '@xterm/addon-fit'
// import { Unicode11Addon } from '@xterm/addon-unicode11'
// import '@xterm/xterm/css/xterm.css'
// import './style.css'
// import { TokenManager } from './auth/tokenManager'
//
// registerSW({ immediate: true })
//
// var app = document.querySelector<HTMLDivElement>('#app')!
// const token = TokenManager.get()
//
// if (token == null) {
//   app.textContent = 'token がありません'
// } else {
//   startTerminal(app, token)
// }
//
//
// async function startTerminal(container: HTMLElement, token: string) {
//   await Promise.all([
//     document.fonts.load('15px "JetBrains Mono"'),
//     document.fonts.load('bold 15px "JetBrains Mono"'),
//   ])
//   await document.fonts.ready
//
//   const term = new Terminal({
//     allowProposedApi: true,
//     cursorBlink: true,
//     fontFamily: '"JetBrains Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
//     fontSize: 15,
//   })
//   term.open(container)
//
//   const fit = new FitAddon()
//   const unicode11 = new Unicode11Addon()
//   term.loadAddon(fit)
//   term.loadAddon(unicode11)
//
//   fit.activate(term)
//   fit.fit()
//
//   term.unicode.activeVersion = '11';
//
//   const proto = location.protocol === 'https:' ? 'wss' : 'ws'
//   const ws = new WebSocket(`${proto}://${location.host}/ws`)
//   ws.binaryType = 'arraybuffer'
//
//   const encoder = new TextEncoder()
//
//   const sendResize = async () => {
//     fit.fit()
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
//     }
//   }
//
//   ws.onopen = () => {
//     ws.send(
//       JSON.stringify({ type: 'init', token, cols: term.cols, rows: term.rows }),
//     )
//     term.focus()
//     fit.fit()
//   }
//
//   ws.onmessage = (e: MessageEvent<ArrayBuffer>) => {
//     term.write(new Uint8Array(e.data))
//   }
//
//   ws.onclose = (e) => {
//     const msg = e.code === 1008 ? 'unauthorized' : 'disconnected'
//     term.write(`\r\n\x1b[33m[${msg}]\x1b[0m\r\n`)
//   }
//
//   ws.onerror = () => {
//     term.write('\r\n\x1b[31m[connection error]\x1b[0m\r\n')
//   }
//
//   term.onData((data) => {
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.send(encoder.encode(data))
//     }
//   })
//
//   new ResizeObserver(() => sendResize()).observe(container)
// }
