import type { BffFailure } from "../../types/bff_failure.type"
import type { SignInNotice } from "../../types/sign_in_notice.type"

function endsPending(failure: BffFailure): SignInNotice | null {
  if (failure.kind === "role-refused") {
    return "role-refused"
  }

  if (failure.kind !== "refused") {
    return null
  }

  if (failure.status === 401 && failure.code === "SIGN_IN_REQUIRED") {
    return "pending-ended"
  }

  if (failure.status === 409 && failure.code === "TWO_FACTOR_ALREADY_ENABLED") {
    return "already-enrolled"
  }

  return null
}

export { endsPending }
