import type { BffCall } from "../types/bff_call.type"
import type { RequestPriority } from "../types/request_priority.type"
import { BffError } from "./bff_error"
import { bffRequest } from "./bff_request"

async function bffFetch<Value>(
  call: BffCall<Value>,
  signal?: AbortSignal,
  priority: RequestPriority = "interactive"
): Promise<Value> {
  const result = await bffRequest(call, signal === undefined ? { priority } : { signal, priority })
  if (!result.ok) {
    throw new BffError(result.failure)
  }

  return result.value
}

export { bffFetch }
