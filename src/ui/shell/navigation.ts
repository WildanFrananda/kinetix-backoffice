import { IdentificationCard, Moped, SquaresFour, Storefront } from "@phosphor-icons/react"
import type { NavItem } from "../../types/nav_item.type"

const navigation: readonly NavItem[] = [
  { to: "/", label: "nav.overview", icon: SquaresFour, exact: true },
  { to: "/approvals/sellers", label: "nav.sellers", icon: Storefront, exact: false },
  { to: "/approvals/couriers", label: "nav.couriers", icon: Moped, exact: false },
  { to: "/account", label: "nav.account", icon: IdentificationCard, exact: false }
]

export { navigation }
