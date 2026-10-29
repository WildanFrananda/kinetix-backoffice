import { createFileRoute } from "@tanstack/react-router"
import { StockPage } from "../../features/stock/StockPage"
import { stockSearch } from "../../features/stock/stock_search"
import type { StockSearch } from "../../types/stock_search.type"
import { inPlace } from "../../ui/in_place"

function StockRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: StockSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <StockPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/warehouse/stock")({
  validateSearch: stockSearch,
  component: StockRoute
})

export { Route }
