import * as v from "valibot"
import type { ErrorBody } from "../types/error_body.type"

const messageShape = v.union([v.string(), v.array(v.string())])

const edgeShape = v.object({
  error: v.string(),
  message: messageShape,
  requestId: v.optional(v.string()),
  traceId: v.optional(v.string())
})

const gatewayShape = v.object({
  message: v.string(),
  request_id: v.optional(v.string())
})

const problemShape = v.object({
  title: v.string(),
  status: v.number(),
  detail: v.optional(v.string()),
  traceId: v.optional(v.string())
})

function sentence(message: string | readonly string[]): string {
  return typeof message === "string" ? message : message.join("; ")
}

function readErrorBody(body: unknown): ErrorBody | null {
  const edge = v.safeParse(edgeShape, body)
  if (edge.success) {
    return {
      code: edge.output.error,
      message: sentence(edge.output.message),
      requestId: edge.output.requestId ?? edge.output.traceId ?? null
    }
  }

  const gateway = v.safeParse(gatewayShape, body)
  if (gateway.success) {
    return { code: null, message: gateway.output.message, requestId: gateway.output.request_id ?? null }
  }

  const problem = v.safeParse(problemShape, body)
  if (problem.success) {
    return {
      code: null,
      message: problem.output.detail ?? problem.output.title,
      requestId: problem.output.traceId ?? null
    }
  }

  return null
}

export { readErrorBody }
