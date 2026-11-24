import type { PTYSession } from "../../../session/sessionManager"
import { SESSION_ID_KEY } from "../../terminal/TerminalPage"
import { EditIcon } from "../../../common/components/icons/EditIcon"
import { PinIcon } from "../../../common/components/icons/PinIcon"
import { TerminalIcon } from "../../../common/components/icons/TerminalIcon"
import { ListRow } from "./ListRow"
import { RowIcon, RowText } from "./RowParts"
import { IconButton } from "../../../common/components/IconButton"

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
          class="row expanded nooutline"
          href={`terminal?${SESSION_ID_KEY}=${props.session.id}`}
          target="_blank"
        >
          <md-focus-ring inward />
          <RowIcon>
            <TerminalIcon variant="contained" />
          </RowIcon>
          <RowText
            title={props.session.title ?? "Terminal"}
            subtitle={props.session.id.substring(0, 8)}
          />
        </a>
        <div class="row row-actions">
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
