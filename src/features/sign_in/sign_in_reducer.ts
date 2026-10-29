import type { SignInEvent } from "../../types/sign_in_event.type"
import type { SignInNotice } from "../../types/sign_in_notice.type"
import type { SignInStep } from "../../types/sign_in_step.type"
import { challengeSeconds, enrolmentSeconds } from "./pending_lifetimes"

function initialStep(notice: SignInNotice | null): SignInStep {
  return { name: "credentials", notice }
}

function signInReducer(step: SignInStep, event: SignInEvent): SignInStep {
  switch (event.type) {
    case "password-accepted":
      if ("mfaRequired" in event.outcome) {
        return {
          name: "challenge",
          endsAt: event.now + challengeSeconds * 1000,
          passkeys: event.outcome.passkeys === true
        }
      }

      return { name: "enrolment", endsAt: event.now + enrolmentSeconds * 1000, setup: null }
    case "setup-received":
      if (step.name !== "enrolment") {
        return step
      }

      return { ...step, setup: event.setup }
    case "enrolment-confirmed":
      return { name: "credentials", notice: "enrolled" }
    case "pending-ended":
      return { name: "credentials", notice: event.notice }
    case "restart":
      return { name: "credentials", notice: null }
  }
}

export { initialStep, signInReducer }
