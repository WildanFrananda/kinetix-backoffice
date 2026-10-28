import { useSyncExternalStore } from "react"
import type { Locale } from "../types/locale.type"
import { storedLocale, subscribeLocale } from "./locale_store"
import { preferredLocale } from "./preferred_locale"

function clientLocale(): Locale {
  return storedLocale() ?? preferredLocale(navigator.languages)
}

function serverLocale(): Locale {
  return "en"
}

function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, clientLocale, serverLocale)
}

export { useLocale }
