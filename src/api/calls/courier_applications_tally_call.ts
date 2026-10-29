import type { BffCall } from "../../types/bff_call.type"
import type { DecisionTally } from "../../types/decision_tally.type"
import { tallySchema } from "../schemas/tally_schema"

function courierApplicationsTallyCall(since: Date): BffCall<DecisionTally> {
  return {
    endpoint: "identity.courierApplicationsTally",
    method: "GET",
    path: "/bff/api/v1/couriers/applications/tally",
    query: { since: since.toISOString() },
    schema: tallySchema
  }
}

export { courierApplicationsTallyCall }
