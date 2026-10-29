import { type Icon, IconBase, type IconWeight } from "@phosphor-icons/react"
import { forwardRef, type ReactElement } from "react"

const weights = new Map<IconWeight, ReactElement>([
  [
    "regular",
    <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z" />
  ]
])

const SignOut: Icon = forwardRef(function SignOut(props, ref) {
  return <IconBase ref={ref} {...props} weights={weights} />
})

export { SignOut }
