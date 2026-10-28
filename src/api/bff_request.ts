import * as v from "valibot"
import type { BffCall } from "../types/bff_call.type"
import type { BffFailure } from "../types/bff_failure.type"
import type { BffResult } from "../types/bff_result.type"
import type { Fetcher } from "../types/fetcher.type"
import type { RequestGovernor } from "../types/request_governor.type"
import type { RequestPriority } from "../types/request_priority.type"
import { reportReachable } from "./connectivity"
import { failureOf } from "./failure_of"
import { governor as sharedGovernor } from "./governor"

async function readJson(response: Response): Promise<{ readable: boolean; body: unknown }> {
  if (response.status === 204) {
    return { readable: true, body: undefined }
  }

  const text = await response.text()
  if (text.length === 0) {
    return { readable: true, body: undefined }
  }

  try {
    return { readable: true, body: JSON.parse(text) }
  } catch {
    return { readable: false, body: undefined }
  }
}

function urlOf(call: BffCall<unknown>): string {
  const url = new URL(call.path, window.location.origin)

  for (const [name, value] of Object.entries(call.query ?? {})) {
    url.searchParams.set(name, value)
  }

  return url.href
}

async function bffRequest<Value>(
  call: BffCall<Value>,
  options: {
    signal?: AbortSignal
    fetcher?: Fetcher
    priority?: RequestPriority
    governor?: RequestGovernor
  } = {}
): Promise<BffResult<Value>> {
  const fetcher: Fetcher = options.fetcher ?? fetch
  const governor = options.governor ?? sharedGovernor
  const headers = new Headers({ Accept: "application/json" })
  const init: RequestInit = { method: call.method, headers, credentials: "same-origin", cache: "no-store" }

  if (call.body !== undefined) {
    headers.set("Content-Type", "application/json")
    init.body = JSON.stringify(call.body)
  }

  if (options.signal !== undefined) {
    init.signal = options.signal
  }

  await governor.acquire(options.priority ?? "interactive", options.signal)

  let response: Response
  try {
    response = await fetcher(urlOf(call), init)
  } catch (error) {
    if (options.signal?.aborted === true) {
      throw error
    }

    reportReachable(false)

    return { ok: false, failure: { kind: "unreachable" } }
  }

  reportReachable(true)

  const { readable, body } = await readJson(response)

  if (!response.ok) {
    const failure: BffFailure = readable
      ? failureOf(response.status, response.headers, body)
      : { kind: "unreadable", status: response.status }
    if (failure.kind === "rate-limited" && failure.scope === "address") {
      governor.holdUntil(Date.now() + (failure.retryAfterSeconds ?? 60) * 1000)
    }

    return { ok: false, failure }
  }

  if (!readable) {
    return { ok: false, failure: { kind: "unreadable", status: response.status } }
  }

  const parsed = v.safeParse(call.schema, body)
  if (!parsed.success) {
    return { ok: false, failure: { kind: "unreadable", status: response.status } }
  }

  return { ok: true, value: parsed.output }
}

export { bffRequest }
