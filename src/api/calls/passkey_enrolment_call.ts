import type { BffCall } from "../../types/bff_call.type"
import type { PasskeyEnrolment } from "../../types/passkey_enrolment.type"
import { enrolmentSchema } from "../schemas/passkey_schemas"

function passkeyEnrolmentCall(userId: number): BffCall<PasskeyEnrolment> {
  return {
    endpoint: "identity.passkeyRegistrationOptions",
    method: "POST",
    path: `/bff/api/v1/auth/passkeys/${userId}/options`,
    body: {},
    schema: enrolmentSchema
  }
}

export { passkeyEnrolmentCall }
