import { useSyncExternalStore } from "react"
import { isPresent, subscribePresence } from "../api/presence"

function serverPresence(): boolean {
  return true
}

function usePresence(): boolean {
  return useSyncExternalStore(subscribePresence, isPresent, serverPresence)
}

export { usePresence }
