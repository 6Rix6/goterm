interface LogoProps {
  size?: number
  color?: string
}

export function Logo(props: LogoProps = { size: 32 }) {
  return (
    <svg
      style={{
        width: `${props.size}px`,
        height: `${props.size}px`,
      }}
      width="512"
      height="512"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      fill={props.color ?? "var(--md-sys-color-on-surface)"}
    >
      <path d="M190.014 329.702L139.727 380H26.3982C33.3766 363.855 39.0334 347.006 43.2341 329.589H190.014V329.702Z" />
      <path d="M486.307 230.408L436.02 280.706H50.9824C51.6212 272.54 51.9474 264.287 51.9474 255.958C51.9474 247.317 51.5964 238.758 50.9093 230.294H486.307V230.408Z" />
      <path d="M387.034 131.113L336.747 181.411H43.0119C38.7542 163.99 33.0382 147.14 26 131H387.034V131.113Z" />
    </svg>
  )
}
