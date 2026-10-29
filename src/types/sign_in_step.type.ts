import type { SignInNotice } from "./sign_in_notice.type"
import type { TwoFactorSetup } from "./two_factor_setup.type"

type SignInStep =
  | {
      name: "credentials"
      notice: SignInNotice | null
    }
  | {
      name: "challenge"
      endsAt: number
      passkeys: boolean
    }
  | {
      name: "enrolment"
      endsAt: number
      setup: TwoFactorSetup | null
    }

export type { SignInStep }
