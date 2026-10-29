import type { Icon } from "@phosphor-icons/react"
import type { Catalogue } from "./catalogue.type"

type NavItem = {
  to: "/" | "/approvals/sellers" | "/approvals/couriers" | "/account"
  label: keyof Catalogue
  icon: Icon
  exact: boolean
}

export type { NavItem }
