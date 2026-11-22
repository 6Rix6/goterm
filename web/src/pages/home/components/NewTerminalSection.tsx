import { PlusIcon } from "./icons/PlusIcon"
import { TerminalIcon } from "./icons/TerminalIcon"
import { ListRow } from "./ListRow"
import { ListSection } from "./ListSection"
import { RowIcon } from "./RowParts"

export function NewTerminalSection() {
  return (
    <ListSection icon={<TerminalIcon />} title="Terminal">
      <ListRow>
        <a class="row full-width" href="terminal" target="_blank">
          <RowIcon>
            <PlusIcon />
          </RowIcon>
          <div class="row-title">New Terminal</div>
        </a>
      </ListRow>
    </ListSection>
  )
}
