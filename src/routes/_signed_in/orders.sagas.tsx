import { createFileRoute } from "@tanstack/react-router"
import { sagasSearch } from "../../features/orders/orders_search"
import { SagasPage } from "../../features/orders/SagasPage"
import type { QueueSearch } from "../../types/queue_search.type"
import { inPlace } from "../../ui/in_place"

function SagasRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: QueueSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <SagasPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/orders/sagas")({
  validateSearch: sagasSearch,
  component: SagasRoute
})

export { Route }
