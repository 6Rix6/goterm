import { SvgIcon, type SvgIconProps } from "./SvgIcon"

export function KeyboardIcon(props: SvgIconProps) {
  return (
    <SvgIcon size={props.size} color={props.color}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        height="24px"
        width="24px"
        fill="currentColor"
      >
        <path d="M4,19q-0.82,0-1.41-0.59T2,17V7Q2,6.18 2.59,5.59T4,5H20q0.83,0 1.41,0.59Q22,6.18 22,7V17q0,0.82-0.59,1.41T20,19H4Zm0-2H20V7H4V17Zm4-1h8V14H8v2ZM5,13H7V11H5v2Zm3,0h2V11H8v2Zm3,0h2V11H11v2Zm3,0h2V11H14v2Zm3,0h2V11H17v2ZM5,10H7V8H5v2Zm3,0h2V8H8v2Zm3,0h2V8H11v2Zm3,0h2V8H14v2Zm3,0h2V8H17v2ZM4,17V7V17Z" />
      </svg>
    </SvgIcon>
  )
}
