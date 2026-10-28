import * as v from "valibot"
import { describe, expect, it } from "vitest"
import { failureOf } from "../../src/api/failure_of"
import { backofficeCalls, otherAppOnly, sellerExamples } from "./backoffice_calls"
import { docsEndpoint } from "./docs_endpoints"

describe.each(backofficeCalls.map((call) => [call.endpoint, call] as const))("%s", (_, call) => {
  it("uses the documented method and path, through the edge", async () => {
    const endpoint = await docsEndpoint(call.endpoint)
    expect(call.method).toBe(endpoint.method)
    const viaEdge = endpoint.path.startsWith("/bff/") ? endpoint.path : `/bff${endpoint.path}`
    expect(call.path).toBe(viaEdge)
  })

  it("sends exactly the documented body fields, every required one included", async () => {
    const endpoint = await docsEndpoint(call.endpoint)
    const documented = endpoint.request.fields.filter((field) => field.in === "body")
    const sent = call.body === undefined ? [] : Object.keys(call.body as object)
    expect(sent.sort()).toEqual(documented.map((field) => field.name).sort())
  })

  it("reads every documented success, except those of another app", async () => {
    const endpoint = await docsEndpoint(call.endpoint)
    for (const answer of endpoint.cases.filter((candidate) => candidate.status < 300)) {
      if (Object.hasOwn(otherAppOnly, answer.when)) {
        expect(v.safeParse(call.schema, answer.json).success, answer.when).toBe(false)
        continue
      }
      if (Object.hasOwn(sellerExamples, answer.when)) {
        expect(v.safeParse(call.schema, answer.json).success, answer.when).toBe(false)
        expect(v.safeParse(call.schema, { ...(answer.json as object), role: "admin" }).success, answer.when).toBe(true)
        continue
      }
      const body = answer.status === 204 ? undefined : answer.json
      expect(v.safeParse(call.schema, body).success, answer.when).toBe(true)
    }
  })

  it("reads every documented refusal as a known failure", async () => {
    const endpoint = await docsEndpoint(call.endpoint)
    for (const answer of endpoint.cases.filter((candidate) => candidate.status >= 400)) {
      const failure = failureOf(answer.status, new Headers({ "Retry-After": "1" }), answer.json)
      expect(failure.kind, answer.when).not.toBe("unreadable")
    }
  })
})
