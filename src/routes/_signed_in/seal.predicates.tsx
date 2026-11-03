import { createFileRoute } from "@tanstack/react-router"
import { PredicatesPage } from "../../features/predicates/PredicatesPage"
import { predicatesSearch } from "../../features/predicates/predicates_search"
import type { PredicatesSearch } from "../../types/predicates_search.type"
import { inPlace } from "../../ui/in_place"

function PredicatesRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: PredicatesSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <PredicatesPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/seal/predicates")({
  validateSearch: predicatesSearch,
  component: PredicatesRoute
})

export { Route }
