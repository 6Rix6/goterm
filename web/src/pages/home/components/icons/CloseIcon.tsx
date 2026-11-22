import { SvgIcon, type SvgIconProps } from "./SvgIcon"

export type CloseIconProps = SvgIconProps & {
  filled?: boolean
}

export function CloseIcon(props: CloseIconProps) {
  return (
    <SvgIcon size={props.size} color={props.color}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="1 1 18 18"
        height="18px"
        width="18px"
        fill="currentColor"
      >
        <path d="M6.06,15L5,13.94L8.94,10L5,6.06L6.06,5L10,8.94L13.94,5L15,6.06L11.06,10L15,13.94L13.94,15L10,11.06L6.06,15Z" />
      </svg>
    </SvgIcon>
  )
}
