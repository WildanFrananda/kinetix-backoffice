import * as v from "valibot"
import { describe, expect, it } from "vitest"
import { bffRequest } from "../../src/api/bff_request"
import { sessionCall } from "../../src/api/calls/session_call"
import { connectivity } from "../../src/api/connectivity"
import type { BffCall } from "../../src/types/bff_call.type"
import type { RequestGovernor } from "../../src/types/request_governor.type"
import type { RequestPriority } from "../../src/types/request_priority.type"

function answering(response: Response | Error | DOMException, seen: Array<{ input: string; init: RequestInit }> = []) {
  return async function fetcher(input: string, init: RequestInit): Promise<Response> {
    seen.push({ input, init })

    if (!(response instanceof Response)) {
      throw response
    }

    return response
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

describe("bffRequest", () => {
  it("asks the app's own origin for JSON without a body or a token", async () => {
    const seen: Array<{ input: string; init: RequestInit }> = []
    await bffRequest(sessionCall, { fetcher: answering(json(200, { authenticated: false }), seen) })
    const call = seen[0]
    expect(call?.input).toBe("https://backoffice.test/bff/session")
    expect(call?.init.method).toBe("GET")
    expect(call?.init.credentials).toBe("same-origin")
    expect(call?.init.cache).toBe("no-store")
    const headers = new Headers(call?.init.headers)
    expect(headers.get("Accept")).toBe("application/json")
    expect(headers.has("Content-Type")).toBe(false)
    expect(headers.has("Authorization")).toBe(false)
    expect(call?.init.body).toBeUndefined()
  })

  it("sends a body as application/json", async () => {
    const seen: Array<{ input: string; init: RequestInit }> = []
    const call = {
      endpoint: "edge.login",
      method: "POST" as const,
      path: "/bff/login" as const,
      body: { email: "a@example.com" },
      schema: v.unknown()
    }

    await bffRequest(call, { fetcher: answering(json(200, {}), seen) })
    expect(new Headers(seen[0]?.init.headers).get("Content-Type")).toBe("application/json")
    expect(seen[0]?.init.body).toBe('{"email":"a@example.com"}')
  })

  it("parses a signed-in session and turns its end into a Date", async () => {
    const body = { authenticated: true, role: "admin", principalId: "p-1", expiresAt: "2026-11-02T08:00:00.000Z" }
    const result = await bffRequest(sessionCall, { fetcher: answering(json(200, body)) })
    expect(result).toEqual({
      ok: true,
      value: { authenticated: true, role: "admin", principalId: "p-1", expiresAt: new Date("2026-11-02T08:00:00.000Z") }
    })
  })

  it("refuses an answer of the wrong shape instead of guessing", async () => {
    const result = await bffRequest(sessionCall, { fetcher: answering(json(200, { authenticated: "yes" })) })
    expect(result).toEqual({ ok: false, failure: { kind: "unreadable", status: 200 } })
  })

  it("refuses a body that is not JSON", async () => {
    const result = await bffRequest(sessionCall, { fetcher: answering(new Response("<html>", { status: 200 })) })
    expect(result).toEqual({ ok: false, failure: { kind: "unreadable", status: 200 } })
  })

  it("reads 204 as no body", async () => {
    const call = {
      endpoint: "edge.logout",
      method: "POST" as const,
      path: "/bff/logout" as const,
      schema: v.undefined()
    }

    const result = await bffRequest(call, { fetcher: answering(new Response(null, { status: 204 })) })
    expect(result).toEqual({ ok: true, value: undefined })
  })

  it("maps a refusal through failureOf", async () => {
    const body = { error: "SESSION_ENDED", message: "Sign in again.", requestId: "req-9" }
    const result = await bffRequest(sessionCall, { fetcher: answering(json(401, body)) })
    expect(result).toEqual({ ok: false, failure: { kind: "signed-out", code: "SESSION_ENDED", requestId: "req-9" } })
  })

  it("reads a failed connection as unreachable", async () => {
    const result = await bffRequest(sessionCall, { fetcher: answering(new TypeError("Failed to fetch")) })
    expect(result).toEqual({ ok: false, failure: { kind: "unreachable" } })
  })

  it("lets an abort through rather than reporting it as a failure", async () => {
    const controller = new AbortController()
    const abort = new DOMException("aborted", "AbortError")
    controller.abort(abort)
    await expect(bffRequest(sessionCall, { signal: controller.signal, fetcher: answering(abort) })).rejects.toBe(abort)
  })

  it("sends a call's query parameters, encoded, on its own path", async () => {
    const seen: Array<{ input: string; init: RequestInit }> = []
    const call: BffCall<unknown> = {
      endpoint: "test.list",
      method: "GET",
      path: "/bff/api/v1/things",
      query: { status: "pending", note: "a b&c" },
      schema: v.unknown()
    }

    await bffRequest(call, { fetcher: answering(json(200, {}), seen) })
    expect(seen[0]?.input).toBe("https://backoffice.test/bff/api/v1/things?status=pending&note=a+b%26c")
  })

  it("asks the governor first, at the priority it was given", async () => {
    const asked: RequestPriority[] = []
    const held: number[] = []
    const governor = recordingGovernor(asked, held)
    await bffRequest(sessionCall, {
      fetcher: answering(json(200, { authenticated: false })),
      governor,
      priority: "background"
    })

    expect(asked).toEqual(["background"])
    expect(held).toEqual([])
  })

  it("holds every request when Kong's per-address budget runs out, but not for one route's own limit", async () => {
    const held: number[] = []
    const governor = recordingGovernor([], held)
    const kong = new Response(JSON.stringify({ message: "API rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "20", "X-RateLimit-Limit-Minute": "100" }
    })

    const before = Date.now()
    await bffRequest(sessionCall, { fetcher: answering(kong), governor })
    expect(held).toHaveLength(1)
    expect(held[0]).toBeGreaterThanOrEqual(before + 20_000)
    const route = new Response(JSON.stringify({ error: "TOO_MANY_REQUESTS", message: "Slow down." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "40" }
    })

    await bffRequest(sessionCall, { fetcher: answering(route), governor })
    expect(held).toHaveLength(1)
  })

  it("reports the server unreachable on a failed connection and reachable again on any answer", async () => {
    await bffRequest(sessionCall, { fetcher: answering(new TypeError("Failed to fetch")) })
    expect(connectivity().reachable).toBe(false)
    await bffRequest(sessionCall, { fetcher: answering(json(503, { message: "down" })) })
    expect(connectivity().reachable).toBe(true)
  })
})

function recordingGovernor(asked: RequestPriority[], held: number[]): RequestGovernor {
  return {
    acquire: async (priority) => {
      asked.push(priority)
    },
    holdUntil: (instant) => {
      held.push(instant)
    },
    state: () => ({ heldUntil: null, waiting: 0 }),
    subscribe: () => () => undefined,
    close: () => undefined
  }
}
