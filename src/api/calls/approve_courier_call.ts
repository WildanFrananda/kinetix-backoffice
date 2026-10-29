import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"
import type { CourierApproval } from "../../types/courier_approval.type"

const approvalSchema = v.object({
  principalId: v.string(),
  email: v.string(),
  role: v.literal("courier"),
  driverId: v.nullable(v.number()),
  fleetActivated: v.boolean()
})

function approveCourierCall(principalId: string): BffCall<CourierApproval> {
  return {
    endpoint: "identity.approveCourier",
    method: "POST",
    path: `/bff/api/v1/couriers/${encodeURIComponent(principalId)}/approve`,
    schema: approvalSchema
  }
}

export { approveCourierCall }
