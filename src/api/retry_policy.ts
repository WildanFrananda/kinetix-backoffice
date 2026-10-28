import { BffError } from "./bff_error"

const maxRetries = 2

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (!(error instanceof BffError)) {
    return false
  }

  const kind = error.failure.kind

  return (kind === "unreachable" || kind === "unavailable") && failureCount < maxRetries
}

function retryDelay(attempt: number): number {
  return Math.min(1000 * 3 ** attempt, 10_000)
}

export { retryDelay, shouldRetry }
