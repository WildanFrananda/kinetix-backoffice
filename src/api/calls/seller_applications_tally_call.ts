import type { BffCall } from "../../types/bff_call.type"
import type { DecisionTally } from "../../types/decision_tally.type"
import { tallySchema } from "../schemas/tally_schema"

function sellerApplicationsTallyCall(since: Date): BffCall<DecisionTally> {
  return {
    endpoint: "identity.sellerApplicationsTally",
    method: "GET",
    path: "/bff/api/v1/sellers/applications/tally",
    query: { since: since.toISOString() },
    schema: tallySchema
  }
}

export { sellerApplicationsTallyCall }
