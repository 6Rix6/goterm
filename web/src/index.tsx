import { render } from "solid-js/web"
import { registerSW } from "virtual:pwa-register"
import "./style.css"
import { TokenManager } from "./auth/tokenManager"
import App from "./App"

registerSW({ immediate: true })
TokenManager.get()

render(() => <App />, document.getElementById("app")!)
