import { usePref } from "../../../../prefs/PrefsProvider"
import { Switch } from "../../../../common/components/Switch"
import type { RightClickMode } from "../../../../terminal/io/terminalIO"
import { For } from "solid-js"
import type { MdOutlinedSelect } from "@material/web/all"
import { SettingsGroup, SettingsItem } from "./SettingsComponents"

export function KeyboardAndMousePanel() {
  const [ctrlVPaste, setCtrlVPaste] = usePref("terminal.keybind.ctrl-v-paste")
  const [ctrlCCopy, setCtrlCCopy] = usePref("terminal.keybind.ctrl-c-copy")

  return (
    <>
      <SettingsGroup label="Keyboard">
        <SettingsItem
          title={
            <div>
              Use <code>Ctrl + V</code> to paste
            </div>
          }
          subtitle={
            <div>
              By default, paste is <code>Ctrl + Shift + V</code>
            </div>
          }
        >
          <Switch value={ctrlVPaste()} onChanged={(v) => setCtrlVPaste(v)} />
        </SettingsItem>
        <SettingsItem
          title={
            <div>
              Use <code>Ctrl + C</code> to copy
            </div>
          }
          subtitle={
            <div>
              By default, copy is <code>Ctrl + Shift + C</code>
            </div>
          }
        >
          <Switch value={ctrlCCopy()} onChanged={(v) => setCtrlCCopy(v)} />
        </SettingsItem>
      </SettingsGroup>
      <SettingsGroup label="Mouse">
        <SettingsItem title={"Right-Clicking behavior"}>
          <RightClickBehaviorSelector />
        </SettingsItem>
      </SettingsGroup>
    </>
  )
}

function RightClickBehaviorSelector() {
  const [mode, setMode] = usePref("terminal.mouse.rightClick")
  const values: Record<RightClickMode, string> = {
    none: "None",
    paste: "Paste",
    copyPaste: "Copy/Paste",
    menu: "Browser-default menu",
  } as const

  const handleChange = (e: Event) => {
    const target = e.target as MdOutlinedSelect
    setMode(target.value as RightClickMode)
  }

  return (
    <md-outlined-select value={mode()} onchange={handleChange}>
      <For each={Object.entries(values)}>
        {([value, label]) => (
          <md-select-option value={value}>
            <div slot="headline">{label}</div>
          </md-select-option>
        )}
      </For>
    </md-outlined-select>
  )
}
