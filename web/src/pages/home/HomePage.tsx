import "./styles/base.css"
import "./styles/layout.css"
import "./styles/list.css"
import "./styles/row.css"
import "./styles/settings-dialog.css"

import "@material/web/all"

import { NewTerminalSection } from "./components/NewTerminalSection"
import { SessionList } from "./components/SessionList"
import { SettingsSection } from "./components/SettingsSection"

export function HomePage() {
  document.title = "Home | GoTerm"

  return (
    <div class="page">
      <div class="page-section full-width">
        <NewTerminalSection />
        <SessionList />
      </div>
      <div class="page-section settings">
        <SettingsSection />
      </div>
    </div>
  )
}
