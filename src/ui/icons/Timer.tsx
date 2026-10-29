import { type Icon, IconBase, type IconWeight } from "@phosphor-icons/react"
import { forwardRef, type ReactElement } from "react"

const weights = new Map<IconWeight, ReactElement>([
  [
    "regular",
    <path d="M128,40a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,40Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,216ZM173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34ZM96,16a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,16Z" />
  ],
  [
    "thin",
    <path d="M128,44a92,92,0,1,0,92,92A92.1,92.1,0,0,0,128,44Zm0,176a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,220ZM170.83,93.17a4,4,0,0,1,0,5.66l-40,40a4,4,0,1,1-5.66-5.66l40-40A4,4,0,0,1,170.83,93.17ZM100,16a4,4,0,0,1,4-4h48a4,4,0,0,1,0,8H104A4,4,0,0,1,100,16Z" />
  ]
])

const Timer: Icon = forwardRef(function Timer(props, ref) {
  return <IconBase ref={ref} {...props} weights={weights} />
})

export { Timer }
