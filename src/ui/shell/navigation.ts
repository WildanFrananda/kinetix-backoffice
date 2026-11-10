import type { NavItem } from "../../types/nav_item.type"
import { IdentificationCard } from "../icons/IdentificationCard"
import { MapTrifold } from "../icons/MapTrifold"
import { Moped } from "../icons/Moped"
import { Path } from "../icons/Path"
import { SealCheck } from "../icons/SealCheck"
import { SquaresFour } from "../icons/SquaresFour"
import { Storefront } from "../icons/Storefront"
import { Tag } from "../icons/Tag"
import { Warehouse } from "../icons/Warehouse"

const navigation: readonly NavItem[] = [
  { to: "/", label: "nav.overview", icon: SquaresFour, exact: true },
  { to: "/dispatch", label: "nav.dispatch", icon: Path, exact: false },
  { to: "/fleet", label: "nav.fleet", icon: MapTrifold, exact: false },
  { to: "/approvals/sellers", label: "nav.sellers", icon: Storefront, exact: false },
  { to: "/approvals/couriers", label: "nav.couriers", icon: Moped, exact: false },
  { to: "/catalog/categories", label: "nav.categories", icon: Tag, exact: false },
  { to: "/warehouse/stock", label: "nav.stock", icon: Warehouse, exact: false },
  { to: "/seal/predicates", label: "nav.predicates", icon: SealCheck, exact: false },
  { to: "/account", label: "nav.account", icon: IdentificationCard, exact: false }
]

export { navigation }
