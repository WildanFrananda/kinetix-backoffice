import type { BffFailure } from "../../types/bff_failure.type"

function retryAt(failure: BffFailure, now: number): number | null {
  if (failure.kind !== "rate-limited" || failure.retryAfterSeconds === null) {
    return null
  }

  return now + failure.retryAfterSeconds * 1000
}

export { retryAt }
