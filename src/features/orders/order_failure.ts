import { outcomeUnknown } from "../../api/outcome_unknown"
import { failureText } from "../../i18n/failure_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import type { OrdersCatalogue } from "../../types/orders_catalogue.type"

function quoted(message: string, code: string | null): string | null {
  if (message.length > 0) {
    return message
  }

  return code
}

function notAdmin(failure: BffFailure): boolean {
  return failure.kind === "refused" && failure.status === 403 && failure.code === null
}

const searchCodes = {
  INVALID_STATUS: "orders.failure.status",
  INVALID_CREATED_RANGE: "orders.failure.range",
  INVALID_CURSOR: "orders.failure.cursor",
  INVALID_MERCHANT: "orders.failure.merchant",
  INVALID_CUSTOMER: "orders.failure.customer",
  INVALID_ORDER_NUMBER: "orders.failure.orderNumber"
} as const

function searchFailure(failure: BffFailure, text: OrdersCatalogue): FailureExplanation {
  if (notAdmin(failure)) {
    return { lead: text["orders.failure.admin"], quote: null }
  }

  if (failure.kind !== "refused" || failure.status >= 500) {
    return { lead: failureText(failure, text), quote: null }
  }

  const known = failure.code === null ? undefined : searchCodes[failure.code as keyof typeof searchCodes]
  if (known !== undefined) {
    return { lead: text[known], quote: quoted(failure.message, null) }
  }

  if (failure.status === 400) {
    return { lead: text["orders.failure.filter"], quote: quoted(failure.message, failure.code) }
  }

  return { lead: failureText(failure, text), quote: quoted(failure.message, failure.code) }
}

function filtersRefused(failure: BffFailure): boolean {
  return failure.kind === "refused" && failure.status === 400
}

function cursorRefused(failure: BffFailure): boolean {
  return failure.kind === "refused" && failure.status === 400 && failure.code === "INVALID_CURSOR"
}

const completionCodes = {
  ORDER_NOT_FOUND: "orders.complete.failure.notFound",
  ORDER_ALREADY_COMPLETED: "orders.complete.failure.already",
  RETURN_UNRESOLVED: "orders.complete.failure.returnUnresolved",
  ORDER_NOT_DELIVERED: "orders.complete.failure.notDelivered"
} as const

function completionFailure(failure: BffFailure, text: OrdersCatalogue): FailureExplanation {
  if (outcomeUnknown(failure)) {
    return { lead: text["orders.complete.failure.uncertain"], quote: null }
  }

  if (notAdmin(failure)) {
    return { lead: text["orders.complete.failure.admin"], quote: null }
  }

  if (failure.kind !== "refused") {
    return { lead: failureText(failure, text), quote: null }
  }

  const known = failure.code === null ? undefined : completionCodes[failure.code as keyof typeof completionCodes]
  if (known !== undefined) {
    return { lead: text[known], quote: quoted(failure.message, null) }
  }

  return { lead: text["orders.complete.failure.refused"], quote: quoted(failure.message, failure.code) }
}

const rejectionCodes = {
  REASON_REQUIRED: "returns.failure.reasonRequired",
  RETURN_NOT_FOUND: "returns.failure.notFound",
  RETURN_ALREADY_REJECTED: "returns.failure.alreadyRejected",
  GOODS_ALREADY_RECEIVED: "returns.failure.goodsReceived"
} as const

function rejectionFailure(failure: BffFailure, text: OrdersCatalogue): FailureExplanation {
  if (outcomeUnknown(failure)) {
    return { lead: text["returns.failure.uncertain"], quote: null }
  }

  if (notAdmin(failure)) {
    return { lead: text["returns.failure.admin"], quote: null }
  }

  if (failure.kind !== "refused") {
    return { lead: failureText(failure, text), quote: null }
  }

  const known = failure.code === null ? undefined : rejectionCodes[failure.code as keyof typeof rejectionCodes]
  if (known !== undefined) {
    return { lead: text[known], quote: quoted(failure.message, null) }
  }

  return { lead: text["returns.failure.refused"], quote: quoted(failure.message, failure.code) }
}

function decidedElsewhere(failure: BffFailure): boolean {
  return failure.kind === "refused" && (failure.status === 404 || failure.status === 409)
}

export { completionFailure, cursorRefused, decidedElsewhere, filtersRefused, rejectionFailure, searchFailure }
