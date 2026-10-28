import * as v from "valibot"
import type { Account } from "../../types/account.type"
import type { BffCall } from "../../types/bff_call.type"
import { instantSchema } from "../schemas/instant_schema"

const accountSchema = v.object({
  principalId: v.string(),
  userId: v.pipe(v.number(), v.integer()),
  email: v.string(),
  role: v.string(),
  expiresAt: instantSchema
})

const meCall: BffCall<Account> = {
  endpoint: "identity.me",
  method: "GET",
  path: "/bff/api/v1/auth/me",
  schema: accountSchema
}

export { meCall }
