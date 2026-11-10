import { createFileRoute } from "@tanstack/react-router"
import { OrdersPage } from "../../features/orders/OrdersPage"
import { ordersSearch } from "../../features/orders/orders_search"
import type { OrdersSearch } from "../../types/orders_search.type"
import { inPlace } from "../../ui/in_place"

function OrdersRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: OrdersSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <OrdersPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/orders/")({
  validateSearch: ordersSearch,
  component: OrdersRoute
})

export { Route }
