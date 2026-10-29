import { failureText } from "../../i18n/failure_text"
import { formatText } from "../../i18n/format_text"
import type { ApprovalsCatalogue } from "../../types/approvals_catalogue.type"
import type { BffFailure } from "../../types/bff_failure.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"

const edgeCodes: ReadonlySet<string> = new Set([
  "IDENTITY_FAILED",
  "IDENTITY_UNAVAILABLE",
  "API_UNAVAILABLE",
  "SESSION_STORE_UNAVAILABLE"
])

function fleetCode(failure: BffFailure, status: number): string | null {
  if (failure.kind !== "unavailable" || failure.status !== status || failure.code === null) {
    return null
  }

  return edgeCodes.has(failure.code) ? null : failure.code
}

function decisionFailure(
  failure: BffFailure,
  text: ApprovalsCatalogue,
  queue: "sellers" | "couriers"
): FailureExplanation {
  if (failure.kind === "refused" && failure.code === "NO_DRIVER_RECORD") {
    return { lead: text["approvals.failure.noVehicle"], quote: null }
  }

  if (failure.kind === "refused" && (failure.status === 404 || failure.status === 409)) {
    return { lead: text["approvals.failure.refused"], quote: failure.message.length > 0 ? failure.message : null }
  }

  if (queue === "couriers" && fleetCode(failure, 503)?.startsWith("FLEET_") === true) {
    return { lead: text["approvals.failure.fleetUnavailable"], quote: null }
  }

  const refusedBy = queue === "couriers" ? fleetCode(failure, 502) : null
  if (refusedBy !== null) {
    return { lead: formatText(text["approvals.failure.fleetRefused"], { code: refusedBy }), quote: null }
  }

  return { lead: failureText(failure, text), quote: null }
}

export { decisionFailure }
