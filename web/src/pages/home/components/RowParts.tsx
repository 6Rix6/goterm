import { type JSX, type ParentProps, Show } from "solid-js"

export function RowIcon(props: ParentProps) {
  return <div class="row-icon">{props.children}</div>
}

export function RowText(props: { title: JSX.Element; subtitle?: JSX.Element }) {
  return (
    <div class="column row-text">
      <div class="row-title">{props.title}</div>
      <Show when={props.subtitle}>
        <div class="row-subtitle">{props.subtitle}</div>
      </Show>
    </div>
  )
}
