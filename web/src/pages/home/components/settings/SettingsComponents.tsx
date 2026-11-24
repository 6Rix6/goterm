import { type ParentProps, type JSX, Show } from "solid-js"

export function SettingsGroup(props: ParentProps<{ label?: String }>) {
  return (
    <div class="settings-group" data-label={props.label}>
      {props.children}
    </div>
  )
}

export function SettingsItem(props: ParentProps<{ title: JSX.Element; subtitle?: JSX.Element }>) {
  return (
    <div class="settings-item">
      <div class="column">
        <div class="row-title">{props.title}</div>
        <Show when={props.subtitle}>
          <div class="row-subtitle">{props.subtitle}</div>
        </Show>
      </div>
      {props.children}
    </div>
  )
}
