import { failureText } from "../../i18n/failure_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { CasesCatalogue } from "../../types/cases_catalogue.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"

function quoted(message: string): string | null {
  return message.length > 0 ? message : null
}

function caseFailure(failure: BffFailure, text: CasesCatalogue): FailureExplanation {
  if (failure.kind !== "refused") {
    return { lead: failureText(failure, text), quote: null }
  }

  if (failure.code === "ADMIN_REQUIRED") {
    return { lead: text["cases.failure.admin"], quote: null }
  }

  if (failure.code === "CASE_NOT_FOUND") {
    return { lead: text["cases.failure.notFound"], quote: null }
  }

  if (failure.code === "INVALID_REQUEST") {
    return { lead: text["cases.failure.invalid"], quote: quoted(failure.message) }
  }

  return { lead: failureText(failure, text), quote: null }
}

export { caseFailure }
