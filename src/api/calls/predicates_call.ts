import type { BffCall } from "../../types/bff_call.type"
import type { PredicateListing } from "../../types/predicate_listing.type"
import { predicateListingSchema } from "../schemas/predicate_schemas"

const predicatesCall: BffCall<PredicateListing> = {
  endpoint: "seal.listPredicates",
  method: "GET",
  path: "/bff/api/v1/seal/predicates",
  schema: predicateListingSchema
}

export { predicatesCall }
