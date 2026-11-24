import { SvgIcon, type SvgIconProps } from "./SvgIcon"

export function RefreshIcon(props: SvgIconProps) {
  return (
    <SvgIcon size={props.size} color={props.color}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="1 1 18 18"
        height="18px"
        width="18px"
        fill="currentColor"
      >
        <path d="M10,16q-2.5,0-4.25-1.75T4,10T5.75,5.75T10,4q1.35,0 2.51,0.56t1.99,1.5V4H16V9H11V7.5h2.73q-0.6-0.92-1.58-1.46T10,5.5q-1.88,0-3.19,1.31T5.5,10t1.31,3.19T10,14.5q1.75,0 3-1.16t1.44-2.84h1.54q-0.19,2.33-1.9,3.92Q12.38,16 10,16Z" />
      </svg>
    </SvgIcon>
  )
}
