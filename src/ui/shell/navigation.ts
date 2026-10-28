import { IdentificationCard, SquaresFour } from "@phosphor-icons/react"
import type { NavItem } from "../../types/nav_item.type"

const navigation: readonly NavItem[] = [
  { to: "/", label: "nav.overview", icon: SquaresFour, exact: true },
  { to: "/account", label: "nav.account", icon: IdentificationCard, exact: false }
]

export { navigation }
