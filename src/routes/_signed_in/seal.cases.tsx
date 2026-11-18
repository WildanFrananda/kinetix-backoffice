import { createFileRoute } from "@tanstack/react-router"
import { CasesPage } from "../../features/cases/CasesPage"
import { casesSearch } from "../../features/cases/cases_search"
import type { CasesSearch } from "../../types/cases_search.type"
import { inPlace } from "../../ui/in_place"

function CasesRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: CasesSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <CasesPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/seal/cases")({
  validateSearch: casesSearch,
  component: CasesRoute
})

export { Route }
