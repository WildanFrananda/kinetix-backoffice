import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser"
import type { BffCall } from "../../types/bff_call.type"
import { signInOptionsSchema } from "../schemas/passkey_schemas"

const passkeyOptionsCall: BffCall<PublicKeyCredentialRequestOptionsJSON> = {
  endpoint: "edge.passkeyOptions",
  method: "POST",
  path: "/bff/2fa/passkey/options",
  body: {},
  schema: signInOptionsSchema
}

export { passkeyOptionsCall }
