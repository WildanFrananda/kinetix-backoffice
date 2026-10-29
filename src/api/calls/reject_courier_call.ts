import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"
import type { RejectedCourier } from "../../types/rejected_courier.type"

const rejectedSchema = v.object({
  applicationId: v.number(),
  email: v.string(),
  status: v.literal("rejected")
})

function rejectCourierCall(principalId: string): BffCall<RejectedCourier> {
  return {
    endpoint: "identity.rejectCourier",
    method: "POST",
    path: `/bff/api/v1/couriers/${encodeURIComponent(principalId)}/reject`,
    schema: rejectedSchema
  }
}

export { rejectCourierCall }
