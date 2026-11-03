import { failureText } from "../../i18n/failure_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import type { PredicatesCatalogue } from "../../types/predicates_catalogue.type"

function quoted(message: string): string | null {
  return message.length > 0 ? message : null
}

function predicateFailure(failure: BffFailure, text: PredicatesCatalogue): FailureExplanation {
  if (failure.kind !== "refused") {
    return { lead: failureText(failure, text), quote: null }
  }

  if (failure.code === "PREDICATE_EXISTS") {
    return { lead: text["predicates.failure.exists"], quote: quoted(failure.message) }
  }

  if (failure.code === "TOO_MANY_PREDICATES") {
    return { lead: text["predicates.failure.full"], quote: quoted(failure.message) }
  }

  if (failure.code === "ADMIN_REQUIRED") {
    return { lead: text["predicates.failure.admin"], quote: null }
  }

  if (failure.code === "NOT_FOUND") {
    return { lead: text["predicates.failure.gone"], quote: null }
  }

  if (failure.code === "INVALID_REQUEST") {
    return { lead: text["predicates.failure.invalid"], quote: quoted(failure.message) }
  }

  return { lead: failureText(failure, text), quote: null }
}

export { predicateFailure }
