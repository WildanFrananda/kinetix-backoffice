import { failureText } from "../../i18n/failure_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { Catalogue } from "../../types/catalogue.type"

function refusalText(failure: BffFailure, text: Catalogue): string {
  if (failure.kind === "refused" && failure.code === "SIGN_IN_REFUSED") {
    return text["refusal.signInRefused"]
  }
  if (failure.kind === "refused" && failure.code === "CODE_REFUSED") {
    return text["refusal.codeRefused"]
  }
  if (failure.kind === "refused" && failure.code === "INVALID_REQUEST") {
    return text["refusal.invalidRequest"]
  }
  if (failure.kind === "rate-limited" && failure.code === "SIGN_IN_DELAYED") {
    return text["refusal.accountDelayed"]
  }
  return failureText(failure, text)
}

export { refusalText }
