import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"

function removePasskeyCall(userId: number, passkeyId: string, password: string): BffCall<undefined> {
  return {
    endpoint: "identity.removePasskey",
    method: "DELETE",
    path: `/bff/api/v1/auth/passkeys/${userId}/${encodeURIComponent(passkeyId)}`,
    body: { password },
    schema: v.undefined()
  }
}

export { removePasskeyCall }
