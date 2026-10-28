import type { BffFailure } from "../types/bff_failure.type"
import { readErrorBody } from "./read_error_body"

const staffGateMessage = "This route is not available from your network"

function retryAfterOf(headers: Headers): number | null {
  const value = headers.get("Retry-After")
  if (value === null || !/^\d+$/.test(value)) {
    return null
  }
  return Number(value)
}

function failureOf(status: number, headers: Headers, body: unknown): BffFailure {
  const error = readErrorBody(body)
  if (status === 429) {
    return { kind: "rate-limited", code: error?.code ?? null, retryAfterSeconds: retryAfterOf(headers) }
  }
  if (status === 502 || status === 503 || status === 504) {
    return { kind: "unavailable", status, code: error?.code ?? null, requestId: error?.requestId ?? null }
  }
  if (error === null) {
    return { kind: "unreadable", status }
  }
  if (status === 401 && (error.code === "SESSION_REQUIRED" || error.code === "SESSION_ENDED")) {
    return { kind: "signed-out", code: error.code, requestId: error.requestId }
  }
  if (status === 403 && error.code === "ROLE_REFUSED") {
    return { kind: "role-refused", requestId: error.requestId }
  }
  if (status === 403 && error.code === "CSRF_REFUSED") {
    return { kind: "csrf-refused", requestId: error.requestId }
  }
  if (status === 403 && error.code === null && error.message === staffGateMessage) {
    return { kind: "network-refused", requestId: error.requestId }
  }
  return { kind: "refused", status, code: error.code, message: error.message, requestId: error.requestId }
}

export { failureOf }
