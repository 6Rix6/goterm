import "@material/web/iconbutton/icon-button"
import "@material/web/icon/icon"
import "@material/web/ripple/ripple"
import { type Component, createEffect, createSignal, For, type JSX } from "solid-js"
import { CloseIcon } from "../icons/CloseIcon"
import { Dynamic } from "solid-js/web"

export type SettingsTab = {
  id: string
  label: string
  icon: JSX.Element
  component: Component
}

type Props = {
  open: boolean
  onClose: () => void
  tabs: SettingsTab[]
}

export function SettingsDialog(props: Props) {
  let dialog!: HTMLDialogElement
  const [activeId, setActiveId] = createSignal(props.tabs[0]?.id)

  const active = () => props.tabs.find((t) => t.id === activeId())

  createEffect(() => {
    if (props.open && !dialog.open) dialog.showModal()
    else if (!props.open && dialog.open) dialog.close()
  })

  return (
    <dialog
      ref={dialog}
      class="settings-dialog"
      aria-labelledby="settings-dialog-title"
      onClose={props.onClose}
      onClick={(e) => {
        if (e.target === dialog) props.onClose()
      }}
    >
      <div class="settings-dialog-body">
        <nav class="settings-nav" aria-label="Settings">
          <h2 id="settings-dialog-title" class="settings-nav-title">
            Settings
          </h2>
          <For each={props.tabs}>
            {(tab) => (
              <button
                type="button"
                class="settings-nav-item"
                classList={{ active: tab.id === activeId() }}
                aria-current={tab.id === activeId() ? "page" : undefined}
                onClick={() => setActiveId(tab.id)}
              >
                <md-ripple />
                <span class="settings-nav-icon">{tab.icon}</span>
                <span class="settings-nav-label">{tab.label}</span>
              </button>
            )}
          </For>
        </nav>

        <div class="settings-content">
          <header class="settings-content-header">
            <h3>{active()?.label}</h3>
            <md-icon-button title="Close" onclick={props.onClose}>
              <md-icon>
                <CloseIcon />
              </md-icon>
            </md-icon-button>
          </header>
          <div class="settings-content-scroll">
            <Dynamic component={active()?.component} />
          </div>
        </div>
      </div>
    </dialog>
  )
}
