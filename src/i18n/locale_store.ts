import type { Locale } from "../types/locale.type"

const storageKey = "kx-locale"
const changeEvent = "kx-locale-change"

function storedLocale(): Locale | null {
  try {
    const value = window.localStorage.getItem(storageKey)
    return value === "en" || value === "id" ? value : null
  } catch {
    return null
  }
}

function chooseLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(storageKey, locale)
  } catch {
    document.documentElement.dataset.localeUnsaved = "true"
  }
  window.dispatchEvent(new Event(changeEvent))
}

function subscribeLocale(onChange: () => void): () => void {
  window.addEventListener("languagechange", onChange)
  window.addEventListener(changeEvent, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener("languagechange", onChange)
    window.removeEventListener(changeEvent, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export { chooseLocale, storedLocale, subscribeLocale }
