import * as v from "valibot"
import type { BffCall } from "../types/bff_call.type"
import type { BffResult } from "../types/bff_result.type"
import type { Fetcher } from "../types/fetcher.type"
import { failureOf } from "./failure_of"

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

async function bffRequest<Value>(
  call: BffCall<Value>,
  options: { signal?: AbortSignal; fetcher?: Fetcher } = {}
): Promise<BffResult<Value>> {
  const fetcher: Fetcher = options.fetcher ?? fetch
  const headers = new Headers({ Accept: "application/json" })
  const init: RequestInit = { method: call.method, headers, credentials: "same-origin", cache: "no-store" }
  if (call.body !== undefined) {
    headers.set("Content-Type", "application/json")
    init.body = JSON.stringify(call.body)
  }
  if (options.signal !== undefined) {
    init.signal = options.signal
  }

  let response: Response
  try {
    response = await fetcher(new URL(call.path, window.location.origin).href, init)
  } catch (error) {
    if (options.signal?.aborted === true) {
      throw error
    }
    return { ok: false, failure: { kind: "unreachable" } }
  }

  const { readable, body } = await readJson(response)
  if (!response.ok) {
    return { ok: false, failure: failureOf(response.status, response.headers, readable ? body : undefined) }
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
