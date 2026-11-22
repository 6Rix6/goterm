import "@material/web/ripple/ripple"
import { type ParentProps, Show } from "solid-js"

export function ListRow(props: ParentProps<{ inactive?: boolean }>) {
  return (
    <li class="list-row" classList={{ inactive: props.inactive }}>
      <Show when={!props.inactive}>
        <md-ripple />
      </Show>
      {props.children}
    </li>
  )
}
