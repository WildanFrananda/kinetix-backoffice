import { type Icon, IconBase, type IconWeight } from "@phosphor-icons/react"
import { forwardRef, type ReactElement } from "react"

const weights = new Map<IconWeight, ReactElement>([
  [
    "regular",
    <path d="M240,184h-8V57.9l9.67-2.08a8,8,0,1,0-3.35-15.64l-224,48A8,8,0,0,0,16,104a8.16,8.16,0,0,0,1.69-.18L24,102.47V184H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,99,216,61.33V184H192V128a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8v56H40Zm136,53H80V136h96ZM80,168h96v16H80Z" />
  ]
])

const Warehouse: Icon = forwardRef(function Warehouse(props, ref) {
  return <IconBase ref={ref} {...props} weights={weights} />
})

export { Warehouse }
