import { IconButton } from "../../../../common/components/IconButton"
import { OpenInNewIcon } from "../../../../common/components/icons/OpenInNewIcon"
import { Logo } from "../Logo"
import { SettingsGroup, SettingsItem } from "./SettingsComponents"

export function AboutPanel() {
  return (
    <>
      <SettingsGroup>
        <div class="settings-item">
          <div class="app-info">
            <Logo size={64} />
            <div>
              <h2 class="app-name">GoTerm</h2>
              <p class="app-description">
                A web-based terminal app build with Golang and Typescript.
              </p>
            </div>
          </div>
        </div>
        <SettingsItem title={"Version"}>
          <div class="app-version">{__APP_VERSION__}</div>
        </SettingsItem>
        <SettingsItem title={"Open-source license"}>
          <IconButton href="https://github.com/6Rix6/goterm" target="_blank">
            <OpenInNewIcon size={20} />
          </IconButton>
        </SettingsItem>
      </SettingsGroup>
    </>
  )
}
