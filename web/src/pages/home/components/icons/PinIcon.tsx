import { SvgIcon, type SvgIconProps } from "./SvgIcon"

export type PinIconProps = SvgIconProps & {
  filled?: boolean
}

export function PinIcon(props: PinIconProps) {
  return (
    <SvgIcon size={props.size} color={props.color}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="1 1 18 18"
        height="18px"
        width="18px"
        fill="currentColor"
      >
        <path
          d={`M13,10l2,2v1.5H10.75v4.75L10,19L9.25,18.25V13.5H5V12l2-2V4.5H6V3h8V4.5H13V10Z${!props.filled ? "M7.13,12h5.75L11.5,10.63V4.5h-3v6.13L7.13,12ZM10,12Z" : ""}`}
        />
      </svg>
    </SvgIcon>
  )
}
