import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { awayAfterMs, followPresence, isPresent } from "../../src/api/presence"

describe("presence", () => {
  const stops: Array<() => void> = []

  beforeEach(() => {
    vi.useFakeTimers()
    stops.push(followPresence())
  })

  afterEach(() => {
    for (const stop of stops.splice(0)) {
      stop()
    }

    vi.useRealTimers()
  })

  it("counts the admin away after five minutes without input, and back on the next key", () => {
    expect(isPresent()).toBe(true)
    vi.advanceTimersByTime(awayAfterMs - 1)
    expect(isPresent()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(isPresent()).toBe(false)

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }))
    expect(isPresent()).toBe(true)
  })

  it("counts a hidden tab as away at once", () => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden")
    document.dispatchEvent(new Event("visibilitychange"))
    expect(isPresent()).toBe(false)
  })
})
