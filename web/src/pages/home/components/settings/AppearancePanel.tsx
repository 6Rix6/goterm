import "@material/web/labs/segmentedbuttonset/outlined-segmented-button-set"
import "@material/web/labs/segmentedbutton/outlined-segmented-button"

import { useTheme } from "../../../../theme/ThemeProvider"
import { usePref } from "../../../../prefs/PrefsProvider"
import { DarkModeIcon } from "../../../../common/components/icons/DarkModeIcon"
import { BrightnessMediumIcon } from "../../../../common/components/icons/BrightnessMediumIcon"
import { LightModeIcon } from "../../../../common/components/icons/LightModeIcon"
import { ColorPicker } from "../../../../common/components/ColorPicker"
import { ImagePicker } from "../../../../common/components/ImagePicker"
import type { MdOutlinedSelect } from "@material/web/all"
import { For } from "solid-js"
import { SettingsItem, SettingsGroup } from "./SettingsComponents"

export function AppearancePanel() {
  return (
    <>
      <SettingsGroup label="Theme">
        <SettingsItem title={"Theme Mode"}>
          <ThemeSelector />
        </SettingsItem>
        <SettingsItem title={"Theme Color"}>
          <ThemeColorPicker />
        </SettingsItem>
        <SettingsItem title={"Terminal Background Image"}>
          <BackgroundImagePicker />
        </SettingsItem>
      </SettingsGroup>
      <SettingsGroup label="Text">
        <SettingsItem title={"Font Size"}>
          <FontSizeSelector />
        </SettingsItem>
        <SettingsItem title={"Line Height"}>
          <LineHeightSelector />
        </SettingsItem>
      </SettingsGroup>
    </>
  )
}

function ThemeSelector() {
  const { mode, setMode } = useTheme()

  return (
    <div style={{ width: "256px" }}>
      <md-outlined-segmented-button-set aria-label="Theme mode">
        <md-outlined-segmented-button
          title="Dark"
          selected={mode() === "dark"}
          onclick={() => setMode("dark")}
        >
          <md-icon slot="icon">
            <DarkModeIcon size={18} />
          </md-icon>
        </md-outlined-segmented-button>
        <md-outlined-segmented-button
          title="Follow system"
          selected={mode() === "system"}
          onclick={() => setMode("system")}
        >
          <md-icon slot="icon">
            <BrightnessMediumIcon size={18} />
          </md-icon>
        </md-outlined-segmented-button>
        <md-outlined-segmented-button
          title="Light"
          selected={mode() === "light"}
          onclick={() => setMode("light")}
        >
          <md-icon slot="icon">
            <LightModeIcon size={18} />
          </md-icon>
        </md-outlined-segmented-button>
      </md-outlined-segmented-button-set>
    </div>
  )
}

function ThemeColorPicker() {
  const { seed, setSeed } = useTheme()

  return <ColorPicker value={seed()} onInput={(e) => setSeed(e.currentTarget.value)} />
}

function BackgroundImagePicker() {
  const [bgImage, setBgImage] = usePref("terminal.appearance.backgroundImage")

  return <ImagePicker image={bgImage()} onChanged={(img) => setBgImage(img)} />
}

function FontSizeSelector() {
  const [fontSize, setFontSize] = usePref("terminal.appearance.fontSize")

  const handleChange = (e: Event) => {
    const target = e.target as MdOutlinedSelect
    const value = Number(target.value)
    if (value) {
      setFontSize(value)
    }
  }

  return (
    <md-outlined-select value={fontSize().toString()} onchange={handleChange}>
      <For each={Array.from({ length: 11 }, (_, i) => i + 10)}>
        {(i) => (
          <md-select-option selected={fontSize() === i} value={i.toString()}>
            <div slot="headline">{i}</div>
          </md-select-option>
        )}
      </For>
    </md-outlined-select>
  )
}

function LineHeightSelector() {
  const [lineHeight, setLineHeight] = usePref("terminal.appearance.lineHeight")

  const handleChange = (e: Event) => {
    const target = e.target as MdOutlinedSelect
    const value = Number(target.value)
    if (value) {
      setLineHeight(value)
    }
  }

  return (
    <md-outlined-select value={lineHeight().toString()} onchange={handleChange}>
      <For each={Array.from({ length: 11 }, (_, i) => Math.round((1 + i * 0.1) * 10) / 10)}>
        {(i) => (
          <md-select-option selected={lineHeight() === i} value={i.toString()}>
            <div slot="headline">{i}</div>
          </md-select-option>
        )}
      </For>
    </md-outlined-select>
  )
}
