import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"

function withdrawPredicateCall(id: string): BffCall<undefined> {
  return {
    endpoint: "seal.withdrawPredicate",
    method: "DELETE",
    path: `/bff/api/v1/seal/predicates/${id}`,
    schema: v.undefined()
  }
}

export { withdrawPredicateCall }
