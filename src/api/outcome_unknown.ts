import type { BffFailure } from "../types/bff_failure.type"

function outcomeUnknown(failure: BffFailure): boolean {
  if (failure.kind === "unavailable" || failure.kind === "unreachable") {
    return true
  }

  return (failure.kind === "refused" || failure.kind === "unreadable") && failure.status >= 500
}

export { outcomeUnknown }
