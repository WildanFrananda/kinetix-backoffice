import { useEffect, useState } from "react"

function useSettled<Value>(value: Value, milliseconds: number): Value | null {
  const [settled, setSettled] = useState<Value | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), milliseconds)

    return () => window.clearTimeout(timer)
  }, [value, milliseconds])

  return settled
}

export { useSettled }
