import type { Icon } from "@phosphor-icons/react"

type ShellNotice = {
  key: "offline" | "unreachable" | "held"
  icon: Icon
  body: string
}

export type { ShellNotice }
