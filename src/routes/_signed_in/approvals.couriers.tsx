import { createFileRoute } from "@tanstack/react-router"
import { approvalsSearch, inPlace } from "../../features/approvals/approvals_search"
import { CourierApprovalsPage } from "../../features/approvals/CourierApprovalsPage"
import type { ApprovalsSearch } from "../../types/approvals_search.type"

function CourierApprovalsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: ApprovalsSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <CourierApprovalsPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/approvals/couriers")({
  validateSearch: approvalsSearch,
  component: CourierApprovalsRoute
})

export { Route }
