import { createSignal } from "solid-js"
import { SettingsIcon } from "./icons/SettingsIcon"
import { ListRow } from "./ListRow"
import { ListSection } from "./ListSection"
import { RowIcon } from "./RowParts"
import { SettingsDialog, type SettingsTab } from "./settings/SettingsDialog"
import { AboutPanel } from "./settings/AboutPanel"
import { GeneralPanel } from "./settings/GeneralPanel"
import { PaletteIcon } from "./icons/PaletteIcon"
import { AppearancePanel } from "./settings/AppearancePanel";

const tabs: SettingsTab[] = [
  { id: "appearance", label: "Appearance", icon: <PaletteIcon />, component: AppearancePanel },
  { id: "general", label: "General", icon: <SettingsIcon />, component: GeneralPanel },
  { id: "about", label: "About", icon: <SettingsIcon />, component: AboutPanel },
]

export function SettingsSection() {
  const [open, setOpen] = createSignal(false)

  return (
    <>
      <ListSection>
        <ListRow>
          <button class="row full-width" type="button" onClick={() => setOpen(true)}>
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
