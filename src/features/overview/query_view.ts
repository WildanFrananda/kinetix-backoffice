import { BffError } from "../../api/bff_error"
import type { BffFailure } from "../../types/bff_failure.type"

function updatedAt(query: { dataUpdatedAt: number }): Date | null {
  return query.dataUpdatedAt > 0 ? new Date(query.dataUpdatedAt) : null
}

function failureIn(error: unknown): BffFailure | null {
  return error instanceof BffError ? error.failure : null
}

export { failureIn, updatedAt }
