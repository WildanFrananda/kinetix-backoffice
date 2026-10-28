import type { BffFailure } from "../types/bff_failure.type"

class BffError extends Error {
  readonly failure: BffFailure

  constructor(failure: BffFailure) {
    super(`The backoffice's request failed: ${failure.kind}`)
    this.name = "BffError"
    this.failure = failure
  }
}

export { BffError }
