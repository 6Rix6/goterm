import { createSignal } from "solid-js"
import { SettingsIcon } from "../../../common/components/icons/SettingsIcon"
import { ListRow } from "./ListRow"
import { ListSection } from "./ListSection"
import { RowIcon } from "./RowParts"
import { SettingsDialog, type SettingsTab } from "./settings/SettingsDialog"
import { AboutPanel } from "./settings/AboutPanel"
import { PaletteIcon } from "../../../common/components/icons/PaletteIcon"
import { AppearancePanel } from "./settings/AppearancePanel"
import { KeyboardIcon } from "../../../common/components/icons/KeyboardIcon"
import { KeyboardAndMousePanel } from "./settings/KeyboardAndMousePanel"

const tabs: SettingsTab[] = [
  {
    id: "appearance",
    label: "Appearance",
    icon: <PaletteIcon />,
    component: AppearancePanel,
  },
  {
    id: "keyboardAndMouuse",
    label: "Keyboard & Mouse",
    icon: <KeyboardIcon />,
    component: KeyboardAndMousePanel,
  },
  {
    id: "about",
    label: "About",
    icon: <SettingsIcon />,
    component: AboutPanel,
  },
]

export function SettingsSection() {
  const [open, setOpen] = createSignal(false)

  return (
    <>
      <ListSection>
        <ListRow>
          <button class="row full-width nooutline" type="button" onClick={() => setOpen(true)}>
            <md-focus-ring />
            <RowIcon>
              <SettingsIcon />
            </RowIcon>
            <div class="full-width nowrap row-title">Settings</div>
          </button>
        </ListRow>
      </ListSection>
      <SettingsDialog open={open()} onClose={() => setOpen(false)} tabs={tabs} />
    </>
  )
}
