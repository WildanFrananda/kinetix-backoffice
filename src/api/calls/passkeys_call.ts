import type { BffCall } from "../../types/bff_call.type"
import type { Passkey } from "../../types/passkey.type"
import { passkeysSchema } from "../schemas/passkey_schemas"

function passkeysCall(userId: number): BffCall<Passkey[]> {
  return {
    endpoint: "identity.listPasskeys",
    method: "GET",
    path: `/bff/api/v1/auth/passkeys/${userId}`,
    schema: passkeysSchema
  }
}

export { passkeysCall }
