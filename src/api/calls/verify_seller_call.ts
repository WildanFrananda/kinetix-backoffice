import * as v from "valibot"
import type { ApprovedMerchant } from "../../types/approved_merchant.type"
import type { BffCall } from "../../types/bff_call.type"

const coordinate = v.optional(v.nullable(v.number()), null)

const approvedSchema = v.pipe(
  v.object({
    userId: v.number(),
    storeName: v.string(),
    status: v.literal("verified"),
    principalId: v.string(),
    latitude: coordinate,
    longitude: coordinate
  }),
  v.transform(
    (merchant): ApprovedMerchant => ({
      userId: merchant.userId,
      storeName: merchant.storeName,
      principalId: merchant.principalId,
      placed: merchant.latitude !== null && merchant.longitude !== null
    })
  )
)

function verifySellerCall(userId: number): BffCall<ApprovedMerchant> {
  return {
    endpoint: "identity.verifySeller",
    method: "POST",
    path: `/bff/api/v1/sellers/${userId}/verify`,
    schema: approvedSchema
  }
}

export { verifySellerCall }
