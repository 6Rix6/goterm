import "@material/web/select/select-option"
import "@material/web/select/outlined-select"
import "@material/web/button/filled-tonal-button"

import { useTheme, type ThemeMode } from "../../../../theme/ThemeProvider"
import type { MdOutlinedSelect } from "@material/web/all"
import { usePref } from "../../../../prefs/PrefsProvider"
import { Show } from "solid-js"

export function AppearancePanel() {
  const { seed, setSeed, mode, setMode } = useTheme()

  return (
    <>
      <div class="settings-group" data-label="Theme">
        <div class="settings-item">
          <div class="column">
            <div class="row-title">Theme mode</div>
          </div>
          <md-outlined-select
            value={mode()}
            onchange={(e) => setMode((e.currentTarget as MdOutlinedSelect).value as ThemeMode)}
          >
            <md-select-option value="system">
              <div slot="headline">Follow system</div>
            </md-select-option>
            <md-select-option value="dark">
              <div slot="headline">Dark</div>
            </md-select-option>
            <md-select-option value="light">
              <div slot="headline">Light</div>
            </md-select-option>
          </md-outlined-select>
        </div>
        <div class="settings-item">
          <div class="column">
            <div class="row-title">Theme color</div>
          </div>
          <span class="input-wrapper">
            <div class="overflow">
              <input type="color" value={seed()} onInput={(e) => setSeed(e.currentTarget.value)} />
            </div>
          </span>
        </div>
      </div>
      <div class="settings-group" data-label="Terminal">
        <div class="settings-item">
          <div class="column">
            <div class="row-title">Background image</div>
          </div>
          <BackgroundImagePicker />
        </div>
      </div>
    </>
  )
}

function BackgroundImagePicker() {
  const [bgImage, setBgImage] = usePref("terminal.appearance.backgroundImage")
  let inputRef!: HTMLInputElement

  const openPicker = () => inputRef.click()

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setBgImage(reader.result as string)
    }
    reader.readAsDataURL(file)

    target.value = ""
  }

  const handleButtonClick = () => {
    if (bgImage()) {
      setBgImage(null)
    } else {
      openPicker()
    }
  }

  return (
    <div class="row">
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      <Show when={bgImage()}>
        {(base64) => <img src={base64()} onClick={openPicker} style={{ cursor: "pointer" }} />}
      </Show>
      <md-filled-tonal-button onclick={handleButtonClick}>
        {bgImage() ? "Delete" : "Select"}
      </md-filled-tonal-button>
    </div>
  )
}
