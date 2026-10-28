import { describe, expect, it } from "vitest"
import { failureOf } from "../../src/api/failure_of"

function edge(error: string, message = "text") {
  return { error, message, requestId: "req-1" }
}

describe("failureOf", () => {
  it("reads an ended or missing session as signed out", () => {
    expect(failureOf(401, new Headers(), edge("SESSION_ENDED"))).toEqual({
      kind: "signed-out",
      code: "SESSION_ENDED",
      requestId: "req-1"
    })
    expect(failureOf(401, new Headers(), edge("SESSION_REQUIRED"))).toMatchObject({ kind: "signed-out" })
  })

  it("tells the edge's role and CSRF refusals apart", () => {
    expect(failureOf(403, new Headers(), edge("ROLE_REFUSED"))).toEqual({ kind: "role-refused", requestId: "req-1" })
    expect(failureOf(403, new Headers(), edge("CSRF_REFUSED"))).toEqual({ kind: "csrf-refused", requestId: "req-1" })
  })

  it("reads the gateway's staff gate as a refused network, not as a role", () => {
    const body = { message: "This route is not available from your network", request_id: "kong-1" }
    expect(failureOf(403, new Headers(), body)).toEqual({ kind: "network-refused", requestId: "kong-1" })
  })

  it("keeps any other 403 as the service's own refusal", () => {
    const body = { message: "Forbidden", request_id: "kong-2" }
    expect(failureOf(403, new Headers(), body)).toEqual({
      kind: "refused",
      status: 403,
      code: null,
      message: "Forbidden",
      requestId: "kong-2"
    })
  })

  it("carries Retry-After on a rate limit and ignores a malformed one", () => {
    expect(failureOf(429, new Headers({ "Retry-After": "17" }), edge("SIGN_IN_DELAYED"))).toEqual({
      kind: "rate-limited",
      code: "SIGN_IN_DELAYED",
      retryAfterSeconds: 17
    })
    expect(failureOf(429, new Headers({ "Retry-After": "soon" }), undefined)).toEqual({
      kind: "rate-limited",
      code: null,
      retryAfterSeconds: null
    })
  })

  it("reads 502, 503 and 504 as unavailable, with or without a readable body", () => {
    expect(failureOf(503, new Headers(), edge("IDENTITY_UNAVAILABLE"))).toEqual({
      kind: "unavailable",
      status: 503,
      code: "IDENTITY_UNAVAILABLE",
      requestId: "req-1"
    })
    expect(failureOf(504, new Headers(), undefined)).toEqual({
      kind: "unavailable",
      status: 504,
      code: null,
      requestId: null
    })
  })

  it("never turns an unreadable refusal into a business answer", () => {
    expect(failureOf(400, new Headers(), { unexpected: true })).toEqual({ kind: "unreadable", status: 400 })
    expect(failureOf(409, new Headers(), undefined)).toEqual({ kind: "unreadable", status: 409 })
  })
})
