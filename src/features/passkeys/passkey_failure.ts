import { failureText } from "../../i18n/failure_text"
import type { AccountCatalogue } from "../../types/account_catalogue.type"
import type { BffFailure } from "../../types/bff_failure.type"

function passkeyFailure(failure: BffFailure, text: AccountCatalogue): string {
  if (failure.kind !== "refused") {
    return failureText(failure, text)
  }

  if (failure.status === 401) {
    return text["account.security.wrongPassword"]
  }

  if (failure.code === "PASSKEY_LIMIT") {
    return text["account.security.limit"]
  }

  if (failure.code === "TWO_FACTOR_REQUIRED") {
    return text["account.security.codeFirst"]
  }

  if (failure.code === "PASSKEY_EXISTS") {
    return text["account.security.already"]
  }

  if (failure.code === "PASSKEY_INVALID") {
    return text["account.security.unverified"]
  }

  if (failure.code === "PASSKEY_CHALLENGE_INVALID") {
    return text["account.security.expired"]
  }

  if (failure.status === 404) {
    return text["account.security.gone"]
  }

  return failure.message.length > 0 ? failure.message : failureText(failure, text)
}

export { passkeyFailure }
