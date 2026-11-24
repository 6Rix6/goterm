import {
  type Component,
  createEffect,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
} from "solid-js"
import { CloseIcon } from "../../../../common/components/icons/CloseIcon"
import { Dynamic } from "solid-js/web"
import { MenuIcon } from "../../../../common/components/icons/MenuIcon"
import { IconButton } from "../../../../common/components/IconButton"

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
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  let nav!: HTMLElement

  const openDrawer = () => {
    setDrawerOpen(true)
    queueMicrotask(() => {
      nav.querySelector<HTMLElement>("md-list-item.active")?.focus()
    })
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
  }

  const active = () => props.tabs.find((t) => t.id === activeId())

  onMount(() => {
    const mql = window.matchMedia("(min-width: 681px)")
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setDrawerOpen(false)
    }
    mql.addEventListener("change", handler)
    onCleanup(() => mql.removeEventListener("change", handler))
  })

  createEffect(() => {
    if (props.open && !dialog.open) {
      dialog.showModal()
    } else if (!props.open && dialog.open) {
      dialog.close()
      setActiveId(props.tabs[0]?.id)
      setDrawerOpen(false)
    }
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
      onKeyDown={(e) => {
        if (e.key === "Escape" && drawerOpen()) {
          e.preventDefault()
          closeDrawer()
        }
      }}
    >
      <div class="settings-dialog-body">
        <div class="settings-scrim" classList={{ open: drawerOpen() }} onClick={closeDrawer} />

        <nav
          ref={nav}
          class="settings-nav"
          classList={{ open: drawerOpen() }}
          aria-label="Settings"
        >
          <h2 id="settings-dialog-title" class="settings-nav-title">
            Settings
          </h2>
          <md-list class="nav" role="menubar" aria-label="List of setting items">
            <For each={props.tabs}>
              {(tab) => {
                const selected = () => tab.id === activeId()
                return (
                  <md-list-item
                    type="button"
                    onclick={() => {
                      setActiveId(tab.id)
                      closeDrawer()
                    }}
                    aria-current={selected() ? "page" : undefined}
                    aria-selected={selected().toString()}
                    classList={{ active: selected() }}
                    role="menuitem"
                  >
                    <md-icon slot="start">{tab.icon}</md-icon>
                    <div slot="headline">{tab.label}</div>
                  </md-list-item>
                )
              }}
            </For>
          </md-list>
        </nav>

        <div class="settings-content" inert={drawerOpen()}>
          <header class="settings-content-header">
            <div class="settings-nav-modal-button">
              <IconButton title="Open navigation menu" onClick={openDrawer}>
                <MenuIcon size={20} />
              </IconButton>
            </div>
            <h3>{active()?.label}</h3>
            <IconButton title="Close dialog" onClick={props.onClose}>
              <CloseIcon size={20} />
            </IconButton>
          </header>
          <div class="settings-content-scroll">
            <Dynamic component={active()?.component} />
          </div>
        </div>
      </div>
    </dialog>
  )
}
