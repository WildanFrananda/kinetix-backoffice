import { createFileRoute } from "@tanstack/react-router"
import { approvalsSearch } from "../../features/approvals/approvals_search"
import { SellerApprovalsPage } from "../../features/approvals/SellerApprovalsPage"
import type { ApprovalsSearch } from "../../types/approvals_search.type"
import { inPlace } from "../../ui/in_place"

function SellerApprovalsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  function onSearch(next: ApprovalsSearch): void {
    void navigate({ search: next, ...inPlace })
  }

  return <SellerApprovalsPage search={search} onSearch={onSearch} />
}

const Route = createFileRoute("/_signed_in/approvals/sellers")({
  validateSearch: approvalsSearch,
  component: SellerApprovalsRoute
})

export { Route }
