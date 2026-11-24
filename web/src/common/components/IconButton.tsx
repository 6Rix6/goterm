import "@material/web/iconbutton/icon-button"
import "@material/web/icon/icon"
import type { ParentProps } from "solid-js"

type LinkTarget = "_blank" | "_parent" | "_self" | "_top"

export function IconButton(
  props: ParentProps<{
    title?: string
    onClick?: () => void
    href?: string
    target?: LinkTarget | ""
  }>,
) {
  return (
    <md-icon-button
      title={props.title}
      onclick={props.onClick}
      href={props.href}
      target={props.target}
    >
      <md-icon>{props.children}</md-icon>
    </md-icon-button>
  )
}
