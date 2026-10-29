import { createFileRoute } from "@tanstack/react-router"
import { CategoriesPage } from "../../features/categories/CategoriesPage"
import { categoriesSearch } from "../../features/categories/categories_search"
import type { CategoriesSearch } from "../../types/categories_search.type"
import { inPlace } from "../../ui/in_place"

function CategoriesRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: CategoriesSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <CategoriesPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/catalog/categories")({
  validateSearch: categoriesSearch,
  component: CategoriesRoute
})

export { Route }
