import { useEffect } from "react"

function isCommandK(event: KeyboardEvent): boolean {
  return event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
}

function useCommandK(onPress: () => void): void {
  useEffect(() => {
    function press(event: KeyboardEvent): void {
      if (!isCommandK(event) || event.repeat) {
        return
      }

      event.preventDefault()
      onPress()
    }

    window.addEventListener("keydown", press)

    return () => window.removeEventListener("keydown", press)
  }, [onPress])
}

function shortcutLabel(): string {
  const platform = typeof navigator === "undefined" ? "" : navigator.platform

  return /Mac|iPhone|iPad/.test(platform) ? "⌘K" : "Ctrl K"
}

export { isCommandK, shortcutLabel, useCommandK }
