import type { LoginOutcome } from "./login_outcome.type"
import type { SignInNotice } from "./sign_in_notice.type"
import type { TwoFactorSetup } from "./two_factor_setup.type"

type SignInEvent =
  | { type: "password-accepted"; outcome: LoginOutcome; now: number }
  | { type: "setup-received"; setup: TwoFactorSetup }
  | { type: "enrolment-confirmed" }
  | { type: "pending-ended"; notice: SignInNotice }
  | { type: "restart" }

export type { SignInEvent }
