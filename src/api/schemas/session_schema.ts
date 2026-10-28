import * as v from "valibot"
import { instantSchema } from "./instant_schema"

const signedInSchema = v.object({
  authenticated: v.literal(true),
  role: v.literal("admin"),
  principalId: v.string(),
  expiresAt: instantSchema
})

const sessionSchema = v.variant("authenticated", [
  signedInSchema,
  v.object({
    authenticated: v.literal(false)
  })
])

export { sessionSchema, signedInSchema }
