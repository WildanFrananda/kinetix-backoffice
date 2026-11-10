import { type Icon, IconBase, type IconWeight } from "@phosphor-icons/react"
import { forwardRef, type ReactElement } from "react"

const weights = new Map<IconWeight, ReactElement>([
  ["regular", <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z" />]
])

const Minus: Icon = forwardRef(function Minus(props, ref) {
  return <IconBase ref={ref} {...props} weights={weights} />
})

export { Minus }
