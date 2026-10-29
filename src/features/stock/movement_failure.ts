import { failureText } from "../../i18n/failure_text"
import { formatText } from "../../i18n/format_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import type { StockCatalogue } from "../../types/stock_catalogue.type"

function quoted(message: string): string | null {
  return message.length > 0 ? message : null
}

function unsure(failure: BffFailure): boolean {
  return (
    failure.kind === "unreachable" ||
    failure.kind === "unavailable" ||
    (failure.kind === "unreadable" && failure.status >= 500)
  )
}

function movementFailure(
  failure: BffFailure,
  text: StockCatalogue,
  kind: "receipt" | "adjustment"
): FailureExplanation {
  if (unsure(failure)) {
    return { lead: text["stock.failure.unsure"], quote: null }
  }

  if (failure.kind !== "refused") {
    return { lead: failureText(failure, text), quote: null }
  }

  const max = failure.numbers.max_reduction
  if (failure.status === 409 && max !== undefined) {
    return { lead: formatText(text["stock.failure.reserved"], { max: String(max) }), quote: null }
  }

  if (failure.code === "IDEMPOTENCY_KEY_CONFLICT") {
    return { lead: text["stock.failure.keyConflict"], quote: null }
  }

  if (failure.code === "STOCK_LIMIT_EXCEEDED") {
    return { lead: text["stock.failure.limit"], quote: null }
  }

  if (failure.code === "UNKNOWN_MERCHANT") {
    return { lead: text["stock.failure.unknownMerchant"], quote: null }
  }

  if (kind === "receipt" && failure.status === 409 && failure.code === null) {
    return { lead: text["stock.failure.wrongOwner"], quote: quoted(failure.message) }
  }

  return { lead: text["stock.failure.refused"], quote: quoted(failure.message) }
}

export { movementFailure }
