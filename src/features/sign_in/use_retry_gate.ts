import { useState } from "react"
import { useNow } from "../../ui/use_now"

function useRetryGate() {
  const [until, setUntil] = useState<number | null>(null)
  const now = useNow(until !== null)
  const remainingSeconds = until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000))

  return { remainingSeconds, blockUntil: setUntil }
}

export { useRetryGate }
