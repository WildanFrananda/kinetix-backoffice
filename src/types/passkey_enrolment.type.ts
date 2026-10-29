import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser"

type PasskeyEnrolment = {
  challengeId: string
  options: PublicKeyCredentialCreationOptionsJSON
}

export type { PasskeyEnrolment }
