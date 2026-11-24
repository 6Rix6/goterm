import { createEffect, createSignal, ErrorBoundary, For, on, Show, Suspense } from "solid-js"
import { TokenManager } from "../../../auth/tokenManager"
import { SessionManager, type PTYSession } from "../../../session/sessionManager"
import { RefreshIcon } from "../../../common/components/icons/RefreshIcon"
import { TerminalIcon } from "../../../common/components/icons/TerminalIcon"
import { ListSection } from "./ListSection"
import { SessionListItem } from "./SessionListItem"
import { StatusRow } from "./StatusRow"
import { IconButton } from "../../../common/components/IconButton";
import type { MdOutlinedTextField } from "@material/web/common"

export function SessionList() {
  const token = TokenManager.get()
  const manager = token ? new SessionManager(token) : null

  return (
    <ListSection
      icon={<TerminalIcon variant="contained" />}
      title="Sessions"
      actions={
        <IconButton title="Reload sessions" onClick={() => manager?.refresh()}>
          <RefreshIcon />
        </IconButton>
      }
    >
      <Show when={manager} fallback={<StatusRow>Failed to get sessions: No token</StatusRow>}>
        {(m) => <SessionListBody manager={m()} />}
      </Show>
    </ListSection>
  )
}

function SessionListBody(props: { manager: SessionManager }) {
  const [editingSession, setEditingSession] = createSignal<PTYSession | null>(null)

  return (
    <>
      <SessionTitleEditDialog
        open={!!editingSession()}
        initialValue={editingSession()?.title}
        onCancel={() => setEditingSession(null)}
        onSubmit={(value) => {
          const s = editingSession()
          if (s) props.manager.setTitle(s.id, value)
          setEditingSession(null)
        }}
      />
      <ErrorBoundary fallback={(e) => <StatusRow>Failed to get sessions: {String(e)}</StatusRow>}>
        <Suspense fallback={<StatusRow>loading...</StatusRow>}>
          <For each={props.manager.sessions} fallback={<StatusRow>No session</StatusRow>}>
            {(session, i) => (
              <SessionListItem
                index={i()}
                session={session}
                onTogglePin={() => props.manager.setPinned(session.id, !session.pinned)}
                onEditTitle={() => setEditingSession(session)}
              />
            )}
          </For>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

function SessionTitleEditDialog(props: {
  open: boolean
  initialValue?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = createSignal<string>("")

  createEffect(
    on(
      () => props.open,
      (open) => {
        if (open) setTitle(props.initialValue ?? "")
      },
    ),
  )

  const submit = () => {
    if (!title().trim().length) return
    props.onSubmit(title())
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <md-dialog quick open={props.open} onclose={() => props.onCancel()}>
      <div slot="headline">Change Title</div>
      <div slot="content">
        <md-outlined-text-field
          label="Title"
          value={title()}
          oninput={(e) => setTitle((e.target as MdOutlinedTextField).value)}
          onkeydown={handleKeyDown}
        />
      </div>
      <div slot="actions">
        <md-filled-tonal-button value="cancel" onclick={() => props.onCancel()}>
          Cancel
        </md-filled-tonal-button>
        <md-filled-button
          disabled={!title().trim().length}
          onclick={submit}
          type="submit"
          value="OK"
        >
          OK
        </md-filled-button>
      </div>
    </md-dialog>
  )
}
