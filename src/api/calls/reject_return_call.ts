import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"

function rejectReturnCall(returnNumber: string, reason: string): BffCall<undefined> {
  return {
    endpoint: "order.rejectReturn",
    method: "POST",
    path: `/bff/api/v1/orders/returns/${encodeURIComponent(returnNumber)}/reject`,
    body: { reason },
    schema: v.undefined()
  }
}

export { rejectReturnCall }
