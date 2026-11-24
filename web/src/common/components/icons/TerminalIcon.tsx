import { SvgIcon, type SvgIconProps } from "./SvgIcon"

export type TerminalIcon = SvgIconProps & {
  variant?: "default" | "contained"
}

export function TerminalIcon(props: TerminalIcon) {
  const path =
    props.variant == "contained"
      ? "M3.5,16q-0.62,0-1.06-0.44T2,14.5V5.49Q2,4.88 2.44,4.44T3.5,4h13q0.62,0 1.06,0.44T18,5.5v9.01q0,0.62-0.44,1.06T16.5,16H3.5Zm0-1.5h13V7H3.5v7.5Zm2.75-1L5.19,12.44l1.69-1.69L5.19,9.06L6.25,8L9,10.75L6.25,13.5Zm3.75,0V12h5v1.5H10Z"
      : "M10,16V14.5h6V16H10ZM5.13,13L4.06,11.94L7.5,8.5L4.06,5.06L5.13,4l4.5,4.5L5.13,13Z"

  return (
    <SvgIcon size={props.size} color={props.color}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="1 1 18 18"
        height="18px"
        width="18px"
        fill="currentColor"
      >
        <path d={path} />
      </svg>
    </SvgIcon>
  )
}
