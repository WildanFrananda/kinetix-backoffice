import { createFileRoute } from "@tanstack/react-router"
import { DispatchPage } from "../../features/fleet/DispatchPage"
import { dispatchSearch } from "../../features/fleet/fleet_search"
import type { DispatchSearch } from "../../types/dispatch_search.type"
import { inPlace } from "../../ui/in_place"

function DispatchRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: DispatchSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <DispatchPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/dispatch")({
  validateSearch: dispatchSearch,
  component: DispatchRoute
})

export { Route }
