import { useEffect, useRef } from "react"
import type { QueueKeys } from "../../types/queue_keys.type"
import { typingTarget } from "../../ui/typing_target"

function useQueueKeys(keys: QueueKeys): void {
  const latest = useRef(keys)
  latest.current = keys

  useEffect(() => {
    function press(event: KeyboardEvent): void {
      const current = latest.current
      if (!current.enabled || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (typingTarget(event.target) || event.repeat) {
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
