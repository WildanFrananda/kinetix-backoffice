import { queryOptions } from "@tanstack/react-query"
import { bffFetch } from "../../api/bff_fetch"
import { predicatesCall } from "../../api/calls/predicates_call"
import type { PredicateListing } from "../../types/predicate_listing.type"

const predicatesKey = ["bff", "seal-predicates"] as const
const placingPollMs = 30_000

function awaitingPlacement(listing: PredicateListing | undefined): boolean {
  return listing?.predicates.some((predicate) => predicate.rows.some((row) => !row.placed)) === true
}

function predicatesQuery() {
  return queryOptions({
    queryKey: predicatesKey,
    queryFn: ({ signal }) => bffFetch(predicatesCall, signal),
    refetchInterval: (query) => (awaitingPlacement(query.state.data) ? placingPollMs : false)
  })
}

export { awaitingPlacement, predicatesKey, predicatesQuery }
