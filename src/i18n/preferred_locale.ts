import type { Locale } from "../types/locale.type"

function preferredLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const primary = language.toLowerCase().split("-")[0]
    if (primary === "id" || primary === "in") {
      return "id"
    }
    if (primary === "en") {
      return "en"
    }
  }
  return "en"
}

export { preferredLocale }
