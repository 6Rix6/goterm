import type { JSX } from "solid-js"

import "./color-picker.css"

export function ColorPicker(props: {
  value: string | number | string[]
  onInput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>
}) {
  return (
    <span class="color-input-wrapper">
      <div class="color-input-overflow">
        <input id="color-input" type="color" value={props.value} onInput={props.onInput} />
      </div>
      <md-focus-ring htmlFor="color-input" />
    </span>
  )
}
