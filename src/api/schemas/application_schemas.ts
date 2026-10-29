import * as v from "valibot"
import { instantSchema } from "./instant_schema"

const sellerStatusSchema = v.picklist(["pending", "verified", "rejected"])

const courierStatusSchema = v.picklist(["pending", "approved"])

const sellerApplicationSchema = v.object({
  applicationId: v.number(),
  userId: v.number(),
  principalId: v.nullable(v.string()),
  email: v.string(),
  storeName: v.string(),
  businessRegistrationNumber: v.string(),
  taxId: v.string(),
  streetAddress: v.string(),
  city: v.string(),
  postalCode: v.string(),
  status: sellerStatusSchema,
  verifiedAt: v.nullable(instantSchema)
})

const courierApplicationSchema = v.object({
  applicationId: v.number(),
  principalId: v.string(),
  userId: v.number(),
  email: v.string(),
  driverId: v.nullable(v.number()),
  status: courierStatusSchema,
  filedAt: instantSchema,
  approvedAt: v.nullable(instantSchema)
})

export { courierApplicationSchema, courierStatusSchema, sellerApplicationSchema, sellerStatusSchema }
