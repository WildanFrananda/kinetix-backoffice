import type { Catalogue } from "../../types/catalogue.type"

function isCatalogueKey(key: string, text: Catalogue): key is keyof Catalogue {
  return Object.hasOwn(text, key)
}

function fieldError(errors: readonly unknown[], text: Catalogue): string | null {
  for (const error of errors) {
    const message = typeof error === "string" ? error : (error as { message?: unknown } | null)?.message
    if (typeof message === "string") {
      return isCatalogueKey(message, text) ? text[message] : message
    }
  }

  return null
}

export { fieldError }
