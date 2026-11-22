import "@material/web/iconbutton/icon-button"
import "@material/web/icon/icon"
import { type JSX, type ParentProps, Show } from "solid-js"

export function RowIcon(props: ParentProps) {
  return <div class="row-icon">{props.children}</div>
}

export function RowText(props: { title: JSX.Element; subtitle?: JSX.Element }) {
  return (
    <div class="column">
      <div class="row-title">{props.title}</div>
      <Show when={props.subtitle}>
        <div class="row-subtitle">{props.subtitle}</div>
      </Show>
    </div>
  )
}

export function IconButton(
  props: ParentProps<{
    title: string
    onClick: () => void
  }>,
) {
  return (
    <md-icon-button title={props.title} onclick={props.onClick}>
      <md-icon>{props.children}</md-icon>
    </md-icon-button>
  )
}
