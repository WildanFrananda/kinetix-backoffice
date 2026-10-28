import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"

function enableTwoFactorCall(code: string): BffCall<{ enabled: true }> {
  return {
    endpoint: "edge.enableTwoFactor",
    method: "POST",
    path: "/bff/2fa/enable",
    body: { code },
    schema: v.object({ enabled: v.literal(true) })
  }
}

export { enableTwoFactorCall }
