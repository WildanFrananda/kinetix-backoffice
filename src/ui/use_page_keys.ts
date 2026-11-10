import { useEffect, useRef } from "react"
import { listenForPageKeys, type PageKeyActions } from "./page_key_listener"

function usePageKeys(keys: PageKeyActions, enabled: boolean): void {
  const latest = useRef({ keys, enabled })
  latest.current = { keys, enabled }

  useEffect(() => listenForPageKeys(() => latest.current), [])
}

export { usePageKeys }
