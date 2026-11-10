import { createFileRoute } from "@tanstack/react-router"
import { FleetPage } from "../../features/fleet/FleetPage"
import { fleetSearch } from "../../features/fleet/fleet_search"
import type { FleetSearch } from "../../types/fleet_search.type"
import { inPlace } from "../../ui/in_place"

function FleetRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: FleetSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <FleetPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/fleet")({
  validateSearch: fleetSearch,
  component: FleetRoute
})

export { Route }
