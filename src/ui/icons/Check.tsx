import { type Icon, IconBase, type IconWeight } from "@phosphor-icons/react"
import { forwardRef, type ReactElement } from "react"

const weights = new Map<IconWeight, ReactElement>([
  [
    "regular",
    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
  ]
])

const Check: Icon = forwardRef(function Check(props, ref) {
  return <IconBase ref={ref} {...props} weights={weights} />
})

export { Check }
