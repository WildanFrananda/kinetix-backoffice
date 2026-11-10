import { failureText } from "../../i18n/failure_text"
import { formatText } from "../../i18n/format_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import type { FleetCatalogue } from "../../types/fleet_catalogue.type"
import type { JobAction } from "../../types/job_action.type"

const codeText = {
  not_found: "dispatch.failure.notFound",
  driver_not_found: "dispatch.failure.driverNotFound",
  already_assigned: "dispatch.failure.alreadyAssigned",
  driver_not_tracked: "dispatch.failure.driverNotTracked",
  driver_unavailable: "dispatch.failure.driverUnavailable",
  not_assigned: "dispatch.failure.notAssigned",
  invalid_transition: "dispatch.failure.invalidTransition",
  bound_to_order: "dispatch.failure.boundToOrder",
  invalid_nearby_query: "dispatch.failure.invalidNearby"
} as const

function jobFailure(failure: BffFailure, action: JobAction | null, text: FleetCatalogue): FailureExplanation {
  if (failure.kind !== "refused") {
    return { lead: failureText(failure, text), quote: null }
  }

  const known = failure.code === null ? undefined : codeText[failure.code as keyof typeof codeText]
  const courier = action === null || action.kind === "cancel" ? "" : String(action.courierId)

  if (known !== undefined) {
    return { lead: formatText(text[known], { courier }), quote: null }
  }

  if (failure.status >= 500) {
    return { lead: failureText(failure, text), quote: failure.message.length > 0 ? failure.message : null }
  }

  return {
    lead: text["dispatch.failure.refused"],
    quote: failure.message.length > 0 ? failure.message : failure.code
  }
}

export { jobFailure }
