import type { ParentProps } from "solid-js"
import "./icon-style.css"

export interface SvgIconProps {
  size?: number
  color?: string
}

export function SvgIcon(props: ParentProps<SvgIconProps>) {
  return (
    <div
      class="svg-icon"
      style={{ color: props.color, width: `${props.size}px`, height: `${props.size}px` }}
    >
      {props.children}
    </div>
  )
}
