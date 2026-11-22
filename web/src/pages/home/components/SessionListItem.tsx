import type { PTYSession } from "../../../session/sessionManager"
import { SESSION_ID_KEY } from "../../terminal/TerminalPage"
import { EditIcon } from "./icons/EditIcon"
import { PinIcon } from "./icons/PinIcon"
import { TerminalIcon } from "./icons/TerminalIcon"
import { ListRow } from "./ListRow"
import { IconButton, RowIcon, RowText } from "./RowParts"

type Props = {
  index: number
  session: PTYSession
  onTogglePin: () => void
  onEditTitle: () => void
}

export function SessionListItem(props: Props) {
  return (
    <ListRow>
      <div class="row full-width">
        <a
          class="row expanded"
          href={`terminal?${SESSION_ID_KEY}=${props.session.id}`}
          target="_blank"
        >
          <RowIcon>
            <TerminalIcon variant="contained" />
          </RowIcon>
          <RowText title={props.session.title ?? "Session"} subtitle={props.session.id} />
        </a>
        <div class="row">
          <IconButton title={"Change session title"} onClick={props.onEditTitle}>
            <EditIcon />
          </IconButton>
          <IconButton title={props.session.pinned ? "Unpin" : "Pin"} onClick={props.onTogglePin}>
            <PinIcon filled={props.session.pinned} />
          </IconButton>
        </div>
      </div>
    </ListRow>
  )
}
