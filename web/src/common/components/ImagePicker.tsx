import { Show } from "solid-js"
import "./image-picker.css"

export function ImagePicker(props: {
  image: string | null
  onChanged: (image: string | null) => void
}) {
  let inputRef!: HTMLInputElement

  const openPicker = () => inputRef.click()

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      props.onChanged(reader.result as string)
    }
    reader.readAsDataURL(file)

    target.value = ""
  }

  const handleButtonClick = () => {
    if (props.image) {
      props.onChanged(null)
    } else {
      openPicker()
    }
  }

  return (
    <div class="row">
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      <Show when={props.image}>
        {(base64) => (
          <button onClick={openPicker} class="pick-button nooutline">
            <md-focus-ring />
            <img src={base64()} />
          </button>
        )}
      </Show>
      <md-filled-tonal-button onclick={handleButtonClick}>
        {props.image ? "Delete" : "Select"}
      </md-filled-tonal-button>
    </div>
  )
}
