import "./style.css"
import { Router, Route } from "@solidjs/router"
import { TerminalPage } from "./pages/TerminalPage"
import { HomePage } from "./pages/HomePage"
import { ThemeProvider } from "./theme/ThemeProvider"
import { type ParentProps } from "solid-js"
import { PrefsProvider } from "./prefs/PrefsProvider"

export function App() {
  return (
    <PrefsProvider>
      <Router root={AppRoot}>
        <Route path="/terminal" component={TerminalPage} />
        <Route path="/" component={HomePage} />
      </Router>
    </PrefsProvider>
  )
}

function AppRoot(props: ParentProps) {
  return <ThemeProvider>{props.children}</ThemeProvider>
}
