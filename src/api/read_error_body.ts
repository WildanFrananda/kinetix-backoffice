import * as v from "valibot"
import type { ErrorBody } from "../types/error_body.type"

const edgeShape = v.object({
  error: v.string(),
  message: v.string(),
  requestId: v.optional(v.string()),
  traceId: v.optional(v.string())
})

const gatewayShape = v.object({
  message: v.string(),
  request_id: v.optional(v.string())
})

function readErrorBody(body: unknown): ErrorBody | null {
  const edge = v.safeParse(edgeShape, body)
  if (edge.success) {
    return {
      code: edge.output.error,
      message: edge.output.message,
      requestId: edge.output.requestId ?? edge.output.traceId ?? null
    }
  }
  const gateway = v.safeParse(gatewayShape, body)
  if (gateway.success) {
    return { code: null, message: gateway.output.message, requestId: gateway.output.request_id ?? null }
  }
  return null
}

export { readErrorBody }
