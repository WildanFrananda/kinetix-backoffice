import type { AuthenticationResponseJSON } from "@simplewebauthn/browser"
import type { BffCall } from "../../types/bff_call.type"
import type { SignedInSession } from "../../types/signed_in_session.type"
import { signedInSchema } from "../schemas/session_schema"

function verifyPasskeyCall(credential: AuthenticationResponseJSON): BffCall<SignedInSession> {
  return {
    endpoint: "edge.verifyPasskey",
    method: "POST",
    path: "/bff/2fa/passkey/verify",
    body: { credential },
    schema: signedInSchema
  }
}

export { verifyPasskeyCall }
