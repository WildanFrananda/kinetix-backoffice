import { useEffect, useRef } from "react"
import type { QueueKeys } from "../../types/queue_keys.type"

const typingTargets = new Set(["INPUT", "TEXTAREA", "SELECT"])

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return typingTargets.has(target.tagName) || target.isContentEditable || target.closest("[role='dialog']") !== null
}

function useQueueKeys(keys: QueueKeys): void {
  const latest = useRef(keys)
  latest.current = keys

  useEffect(() => {
    function press(event: KeyboardEvent): void {
      const current = latest.current
      if (!current.enabled || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (typing(event.target) || event.repeat) {
        return
      }

      const actions: Readonly<Record<string, (() => void) | null>> = {
        j: current.next,
        k: current.previous,
        a: current.approve,
        r: current.reject
      }

      const action = actions[event.key.toLowerCase()]
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

export { useQueueKeys }
