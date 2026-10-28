import { describe, expect, it } from "vitest"
import { BffError } from "../../src/api/bff_error"
import { retryDelay, shouldRetry } from "../../src/api/retry_policy"

describe("the retry policy", () => {
  it("retries a lost connection and an unavailable upstream, twice at most", () => {
    const unreachable = new BffError({ kind: "unreachable" })
    const unavailable = new BffError({ kind: "unavailable", status: 503, code: null, requestId: null })
    expect(shouldRetry(0, unreachable)).toBe(true)
    expect(shouldRetry(1, unavailable)).toBe(true)
    expect(shouldRetry(2, unreachable)).toBe(false)
  })

  it("never retries an answer the server meant", () => {
    const answers = [
      new BffError({ kind: "signed-out", code: "SESSION_ENDED", requestId: null }),
      new BffError({ kind: "rate-limited", scope: "address", code: null, retryAfterSeconds: 30 }),
      new BffError({ kind: "refused", status: 409, code: "CONFLICT", message: "Taken.", requestId: null }),
      new BffError({ kind: "unreadable", status: 200 }),
      new Error("a bug")
    ]
    for (const answer of answers) {
      expect(shouldRetry(0, answer)).toBe(false)
    }
  })

  it("waits one second, then three, and never more than ten", () => {
    expect(retryDelay(0)).toBe(1_000)
    expect(retryDelay(1)).toBe(3_000)
    expect(retryDelay(5)).toBe(10_000)
  })
})
