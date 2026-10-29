import type { RegistrationResponseJSON } from "@simplewebauthn/browser"
import type { BffCall } from "../../types/bff_call.type"
import type { Passkey } from "../../types/passkey.type"
import { passkeySchema } from "../schemas/passkey_schemas"

function registerPasskeyCall(
  userId: number,
  request: { challengeId: string; name: string; credential: RegistrationResponseJSON }
): BffCall<Passkey> {
  return {
    endpoint: "identity.registerPasskey",
    method: "POST",
    path: `/bff/api/v1/auth/passkeys/${userId}`,
    body: request,
    schema: passkeySchema
  }
}

export { registerPasskeyCall }
