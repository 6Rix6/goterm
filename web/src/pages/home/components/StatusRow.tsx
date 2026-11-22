import { type ParentProps } from "solid-js"
import { ListRow } from "./ListRow"

export function StatusRow(props: ParentProps) {
  return (
    <ListRow inactive>
      <div class="row full-width">
        <div class="row-title">{props.children}</div>
      </div>
    </ListRow>
  )
}
