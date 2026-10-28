import type { ThemeChoice } from "../types/theme_choice.type"

const storageKey = "kx-theme"
const changeEvent = "kx-theme-change"
const lightQuery = "(prefers-color-scheme: light)"

function storedTheme(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(storageKey)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

function applyTheme(choice: ThemeChoice): void {
  const light = choice === "light" || (choice === "system" && window.matchMedia(lightQuery).matches)
  document.documentElement.dataset.theme = light ? "light" : "dark"
}

function chooseTheme(choice: ThemeChoice): void {
  try {
    if (choice === "system") {
      window.localStorage.removeItem(storageKey)
    } else {
      window.localStorage.setItem(storageKey, choice)
    }
  } catch {
    document.documentElement.dataset.themeUnsaved = "true"
  }

  applyTheme(choice)
  window.dispatchEvent(new Event(changeEvent))
}

function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia(lightQuery)
  function follow(): void {
    applyTheme(storedTheme())
    onChange()
  }

  media.addEventListener("change", follow)
  window.addEventListener(changeEvent, onChange)
  window.addEventListener("storage", follow)

  return () => {
    media.removeEventListener("change", follow)
    window.removeEventListener(changeEvent, onChange)
    window.removeEventListener("storage", follow)
  }
}

export { chooseTheme, storedTheme, subscribeTheme }
