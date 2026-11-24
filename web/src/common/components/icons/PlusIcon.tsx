import { SvgIcon, type SvgIconProps } from "./SvgIcon"

export function PlusIcon(props: SvgIconProps) {
  return (
    <SvgIcon size={props.size} color={props.color}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="1 1 18 18"
        height="18px"
        width="18px"
        fill="currentColor"
      >
        <path d="M9.25,10.75H5V9.25H9.25V5h1.5V9.25H15v1.5H10.75V15H9.25V10.75Z" />
      </svg>
    </SvgIcon>
  )
}
