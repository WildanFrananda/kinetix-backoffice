import { useEffect } from "react"
import { useNow } from "../../ui/use_now"

function usePendingClock(endsAt: number, onEnded: () => void): number {
  const now = useNow(true)
  const remaining = endsAt - now
  useEffect(() => {
    if (remaining <= 0) {
      onEnded()
    }
  }, [remaining, onEnded])
  return remaining
}

export { usePendingClock }
