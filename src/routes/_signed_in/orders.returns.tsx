import { createFileRoute } from "@tanstack/react-router"
import { returnsSearch } from "../../features/orders/orders_search"
import { ReturnsPage } from "../../features/orders/ReturnsPage"
import type { QueueSearch } from "../../types/queue_search.type"
import { inPlace } from "../../ui/in_place"

function ReturnsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: QueueSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <ReturnsPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/orders/returns")({
  validateSearch: returnsSearch,
  component: ReturnsRoute
})

export { Route }
