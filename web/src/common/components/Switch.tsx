import type { MdSwitch } from "@material/web/all"

export function Switch(props: {
  value: boolean
  onChanged: (value: boolean) => void
  id?: string
  disabled?: boolean
}) {
  const handleOnChange = (e: Event) => {
    const target = e.target as MdSwitch
    props.onChanged(target.selected)
  }

  return (
    <md-switch
      icons
      show-only-selected-icon
      selected={props.value}
      onchange={handleOnChange}
      id={props.id}
      disabled={props.disabled}
    />
  )
}
