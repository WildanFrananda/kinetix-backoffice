import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from "@simplewebauthn/browser"
import * as v from "valibot"
import type { Passkey } from "../../types/passkey.type"
import type { PasskeyEnrolment } from "../../types/passkey_enrolment.type"
import { instantSchema } from "./instant_schema"

const transportSchema = v.picklist(["ble", "cable", "hybrid", "internal", "nfc", "smart-card", "usb"])

const descriptorSchema = v.object({
  id: v.string(),
  type: v.literal("public-key"),
  transports: v.exactOptional(v.array(transportSchema))
})

const verificationSchema = v.picklist(["required", "preferred", "discouraged"])

const requestOptionsSchema = v.object({
  challenge: v.string(),
  timeout: v.exactOptional(v.number()),
  rpId: v.exactOptional(v.string()),
  allowCredentials: v.exactOptional(v.array(descriptorSchema)),
  userVerification: v.exactOptional(verificationSchema)
}) satisfies v.GenericSchema<unknown, PublicKeyCredentialRequestOptionsJSON>

const creationOptionsSchema = v.object({
  rp: v.object({ id: v.exactOptional(v.string()), name: v.string() }),
  user: v.object({ id: v.string(), name: v.string(), displayName: v.string() }),
  challenge: v.string(),
  pubKeyCredParams: v.array(v.object({ alg: v.number(), type: v.literal("public-key") })),
  timeout: v.exactOptional(v.number()),
  excludeCredentials: v.exactOptional(v.array(descriptorSchema)),
  authenticatorSelection: v.exactOptional(
    v.object({
      authenticatorAttachment: v.exactOptional(v.picklist(["platform", "cross-platform"])),
      requireResidentKey: v.exactOptional(v.boolean()),
      residentKey: v.exactOptional(v.picklist(["required", "preferred", "discouraged"])),
      userVerification: v.exactOptional(verificationSchema)
    })
  ),
  attestation: v.exactOptional(v.picklist(["none", "indirect", "direct", "enterprise"]))
}) satisfies v.GenericSchema<unknown, PublicKeyCredentialCreationOptionsJSON>

const signInOptionsSchema = v.pipe(
  v.object({ options: requestOptionsSchema }),
  v.transform((answer): PublicKeyCredentialRequestOptionsJSON => answer.options)
)

const enrolmentSchema = v.object({
  challengeId: v.string(),
  options: creationOptionsSchema
}) satisfies v.GenericSchema<unknown, PasskeyEnrolment>

const passkeySchema = v.object({
  id: v.string(),
  name: v.string(),
  createdAt: instantSchema,
  lastUsedAt: v.nullable(instantSchema),
  deviceType: v.string(),
  backedUp: v.boolean()
}) satisfies v.GenericSchema<unknown, Passkey>

const passkeysSchema = v.pipe(
  v.object({ passkeys: v.array(passkeySchema) }),
  v.transform((answer): Passkey[] => answer.passkeys)
)

export { enrolmentSchema, passkeySchema, passkeysSchema, signInOptionsSchema }
