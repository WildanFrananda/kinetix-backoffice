import { useEffect, useRef } from "react"
import type { QueueKeys } from "../../types/queue_keys.type"
import { listenForPageKeys } from "../../ui/page_key_listener"

function useQueueKeys(keys: QueueKeys): void {
  const latest = useRef(keys)
  latest.current = keys

  useEffect(
    () =>
      listenForPageKeys(() => ({
        enabled: latest.current.enabled,
        keys: {
          j: latest.current.next,
          k: latest.current.previous,
          a: latest.current.approve,
          r: latest.current.reject
        }
      })),
    []
  )
}

export { useQueueKeys }
