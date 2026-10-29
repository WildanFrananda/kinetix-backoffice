import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"
import type { RejectedSeller } from "../../types/rejected_seller.type"

const rejectedSchema = v.object({
  userId: v.number(),
  status: v.literal("rejected")
})

function rejectSellerCall(userId: number): BffCall<RejectedSeller> {
  return {
    endpoint: "identity.rejectSeller",
    method: "POST",
    path: `/bff/api/v1/sellers/${userId}/reject`,
    schema: rejectedSchema
  }
}

export { rejectSellerCall }
