import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"
import type { TwoFactorSetup } from "../../types/two_factor_setup.type"

const setupSchema = v.object({
  twoFactorSecret: v.pipe(v.string(), v.regex(/^[A-Z2-7]+=*$/)),
  qrCodeUrl: v.pipe(v.string(), v.startsWith("otpauth://totp/")),
  enabled: v.literal(false)
})

const setupTwoFactorCall: BffCall<TwoFactorSetup> = {
  endpoint: "edge.setupTwoFactor",
  method: "POST",
  path: "/bff/2fa/setup",
  schema: setupSchema
}

export { setupTwoFactorCall }
