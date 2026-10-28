import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"
import type { LoginOutcome } from "../../types/login_outcome.type"

const loginSchema = v.union([
  v.strictObject({ mfaRequired: v.literal(true) }),
  v.strictObject({ mfaEnrolmentRequired: v.literal(true) })
])

function loginCall(email: string, password: string): BffCall<LoginOutcome> {
  return {
    endpoint: "edge.login",
    method: "POST",
    path: "/bff/login",
    body: { email, password },
    schema: loginSchema
  }
}

export { loginCall }
