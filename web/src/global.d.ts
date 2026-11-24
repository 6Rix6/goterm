import "@material/web/all"
import "@material/web/labs/segmentedbuttonset/outlined-segmented-button-set"
import "@material/web/labs/segmentedbutton/outlined-segmented-button"
import "@material/web/labs/navigationdrawer/navigation-drawer"
import "@material/web/labs/navigationdrawer/navigation-drawer-modal"

type WithAnyChildrenAndClasses =
  | { children: any }
  | {}
  | { class?: string; classList?: Record<string, boolean> }

type SolidInterface = {
  [P in keyof HTMLElementTagNameMap]: HTMLElementTagNameMap[P] | WithAnyChildrenAndClasses
}

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements extends SolidInterface {}
  }
}
