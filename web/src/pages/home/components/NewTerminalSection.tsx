import { PlusIcon } from "../../../common/components/icons/PlusIcon"
import { TerminalIcon } from "../../../common/components/icons/TerminalIcon"
import { ListRow } from "./ListRow"
import { ListSection } from "./ListSection"
import { RowIcon } from "./RowParts"

export function NewTerminalSection() {
  return (
    <ListSection icon={<TerminalIcon />} title="Terminal">
      <ListRow>
        <a class="row full-width nooutline" href="terminal" target="_blank">
          <md-focus-ring inward />
          <RowIcon>
            <PlusIcon />
          </RowIcon>
          <div class="row-title">New Terminal</div>
        </a>
      </ListRow>
    </ListSection>
  )
}
