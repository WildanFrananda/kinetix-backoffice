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
      field: null,
      numbers: {},
      requestId: "kong-2"
    })
  })

  it("carries Retry-After on a rate limit and ignores a malformed one", () => {
    expect(failureOf(429, new Headers({ "Retry-After": "17" }), edge("SIGN_IN_DELAYED"))).toEqual({
      kind: "rate-limited",
      scope: "route",
      code: "SIGN_IN_DELAYED",
      retryAfterSeconds: 17
    })

    expect(failureOf(429, new Headers({ "Retry-After": "soon" }), undefined)).toEqual({
      kind: "rate-limited",
      scope: "route",
      code: null,
      retryAfterSeconds: null
    })
  })

  it("reads identity's validation list and order's problem details as refusals with their words", () => {
    const nest = {
      message: ["limit must not be greater than 200", "status must be one of the following values: pending"],
      error: "Bad Request",
      statusCode: 400,
      traceId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"
    }

    expect(failureOf(400, new Headers(), nest)).toEqual({
      kind: "refused",
      status: 400,
      code: "Bad Request",
      message: "limit must not be greater than 200; status must be one of the following values: pending",
      field: null,
      numbers: {},
      requestId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"
    })

    const problem = {
      type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
      title: "One or more validation errors occurred.",
      status: 400,
      errors: { limit: ["The value 'all' is not valid."] },
      traceId: "00-abc-def-01"
    }

    expect(failureOf(400, new Headers(), problem)).toMatchObject({
      kind: "refused",
      message: "One or more validation errors occurred.",
      requestId: "00-abc-def-01"
    })
  })

  it("keeps the field a service names in its refusal", () => {
    const catalog = {
      error: "INVALID_INPUT",
      message: "must be 1 to 128 letters, digits, hyphens or underscores",
      field: "slug",
      traceId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"
    }

    expect(failureOf(400, new Headers(), catalog)).toEqual({
      kind: "refused",
      status: 400,
      code: "INVALID_INPUT",
      message: "must be 1 to 128 letters, digits, hyphens or underscores",
      field: "slug",
      numbers: {},
      requestId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"
    })
  })

  it("reads warehouse's bare sentences and codes, and keeps the numbers a refusal carries", () => {
    const reserved = {
      error: "that would cut into stock already reserved for orders",
      quantity_on_hand: 34,
      reserved_quantity: 4,
      max_reduction: 30
    }

    expect(failureOf(409, new Headers(), reserved)).toEqual({
      kind: "refused",
      status: 409,
      code: null,
      message: "that would cut into stock already reserved for orders",
      field: null,
      numbers: { quantity_on_hand: 34, reserved_quantity: 4, max_reduction: 30 },
      requestId: null
    })

    expect(failureOf(404, new Headers(), { status: 404, error: "Not Found" })).toMatchObject({
      kind: "refused",
      code: null,
      message: "Not Found",
      numbers: {}
    })

    expect(
      failureOf(409, new Headers(), { error: "CATEGORY_IN_USE", message: "in use", product_count: 12 })
    ).toMatchObject({ code: "CATEGORY_IN_USE", numbers: { product_count: 12 } })
  })

  it("reads an authorization refusal with no body as a refusal, and a body it cannot parse as unreadable", () => {
    expect(failureOf(403, new Headers(), undefined)).toEqual({
      kind: "refused",
      status: 403,
      code: null,
      message: "",
      field: null,
      numbers: {},
      requestId: null
    })

    expect(failureOf(403, new Headers(), { unexpected: true })).toEqual({ kind: "unreadable", status: 403 })
  })

  it("tells Kong's per-address budget from one route's own limit by Kong's headers", () => {
    const kong = { message: "API rate limit exceeded", request_id: "kong-3" }
    const budget = new Headers({ "Retry-After": "23", "RateLimit-Limit": "100", "X-RateLimit-Limit-Minute": "100" })
    expect(failureOf(429, budget, kong)).toMatchObject({
      kind: "rate-limited",
      scope: "address",
      retryAfterSeconds: 23
    })

    const route = new Headers({ "Retry-After": "40", "X-RateLimit-Limit": "10" })
    expect(failureOf(429, route, edge("TOO_MANY_REQUESTS"))).toMatchObject({ scope: "route" })
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
