import { type JSX, type ParentProps, Show } from "solid-js"
import { RowIcon } from "./RowParts"

type Props = ParentProps<{
  icon?: JSX.Element
  title?: string
  actions?: JSX.Element
}>

export function ListSection(props: Props) {
  return (
    <section class="list-section">
      <Show when={props.title}>
        <header class="list-header row">
          <div class="row expanded">
            <RowIcon>{props.icon}</RowIcon>
            <h3>{props.title}</h3>
          </div>
          <Show when={props.actions}>
            <div class="row">{props.actions}</div>
          </Show>
        </header>
      </Show>
      <ul class="list">{props.children}</ul>
    </section>
  )
}
