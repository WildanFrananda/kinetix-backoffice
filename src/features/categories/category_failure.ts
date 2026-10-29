import { failureText } from "../../i18n/failure_text"
import { formatText } from "../../i18n/format_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { CategoriesCatalogue } from "../../types/categories_catalogue.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"

function quoted(message: string): string | null {
  return message.length > 0 ? message : null
}

function categoryFailure(failure: BffFailure, text: CategoriesCatalogue): FailureExplanation {
  if (failure.kind !== "refused") {
    return { lead: failureText(failure, text), quote: null }
  }

  if (failure.code === "CATEGORY_TAKEN") {
    return { lead: text["categories.failure.taken"], quote: quoted(failure.message) }
  }

  if (failure.code === "CATEGORY_IN_USE") {
    return { lead: text["categories.failure.inUse"], quote: quoted(failure.message) }
  }

  if (failure.code === "CATEGORY_NOT_FOUND") {
    return { lead: text["categories.failure.gone"], quote: null }
  }

  if (failure.code === "INVALID_INPUT" && (failure.field === "name" || failure.field === "slug")) {
    const field = text[failure.field === "name" ? "categories.field.name" : "categories.field.slug"]

    return {
      lead: formatText(text["categories.failure.invalid"], { field: field.toLocaleLowerCase() }),
      quote: quoted(failure.message)
    }
  }

  return { lead: failureText(failure, text), quote: null }
}

export { categoryFailure }
