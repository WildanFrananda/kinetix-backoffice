import type { BffCall } from "../../types/bff_call.type"
import type { SignedInSession } from "../../types/signed_in_session.type"
import { signedInSchema } from "../schemas/session_schema"

function verifyTwoFactorCall(code: string): BffCall<SignedInSession> {
  return {
    endpoint: "edge.verifyTwoFactor",
    method: "POST",
    path: "/bff/2fa/verify",
    body: { code },
    schema: signedInSchema
  }
}

export { verifyTwoFactorCall }
