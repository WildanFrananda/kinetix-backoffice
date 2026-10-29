import { useEffect, useRef } from "react"
import { typingTarget } from "./typing_target"

type PageKeys = Readonly<Record<string, (() => void) | null>>

function usePageKeys(keys: PageKeys, enabled: boolean): void {
  const latest = useRef({ keys, enabled })
  latest.current = { keys, enabled }

  useEffect(() => {
    function press(event: KeyboardEvent): void {
      const current = latest.current
      if (!current.enabled || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (typingTarget(event.target) || event.repeat) {
        return
      }

      const action = current.keys[event.key.toLowerCase()]
      if (action === undefined || action === null) {
        return
      }

      event.preventDefault()
      action()
    }

    window.addEventListener("keydown", press)

    return () => window.removeEventListener("keydown", press)
  }, [])
}

export { usePageKeys }
