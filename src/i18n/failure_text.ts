import type { BffFailure } from "../types/bff_failure.type"
import type { Catalogue } from "../types/catalogue.type"
import { formatText } from "./format_text"

function referenceOf(failure: BffFailure): string {
  if ("requestId" in failure && failure.requestId !== null) {
    return failure.requestId
  }

  if ("status" in failure) {
    return `HTTP ${failure.status}`
  }

  return failure.kind
}

function failureText(failure: BffFailure, text: Catalogue): string {
  switch (failure.kind) {
    case "network-refused":
      return text["failure.networkRefused"]
    case "rate-limited":
      return text["failure.rateLimited"]
    case "unavailable":
      return text["failure.unavailable"]
    case "unreachable":
      return text["failure.unreachable"]
    case "signed-out":
      return text["notice.sessionEnded"]
    case "role-refused":
      return text["notice.roleRefused"]
    case "csrf-refused":
    case "refused":
    case "unreadable":
      return formatText(text["failure.unexpected"], { reference: referenceOf(failure) })
  }
}

export { failureText }
