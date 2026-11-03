import type { BffCall } from "../../types/bff_call.type"
import type { Predicate } from "../../types/predicate.type"
import type { PredicateDraft } from "../../types/predicate_draft.type"
import { predicateSchema } from "../schemas/predicate_schemas"

function approvePredicateCall(draft: PredicateDraft): BffCall<Predicate> {
  return {
    endpoint: "seal.approvePredicate",
    method: "POST",
    path: "/bff/api/v1/seal/predicates",
    body: {
      class: "courier",
      label: draft.label,
      minimums: draft.minimums,
      freshnessDays: draft.freshnessDays
    },
    schema: predicateSchema
  }
}

export { approvePredicateCall }
