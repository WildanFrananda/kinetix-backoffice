import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createRequestGovernor } from "../../src/api/request_governor"
import type { RequestGovernor } from "../../src/types/request_governor.type"

function governorOf(limit: number, windowMs: number, channelName: string | null = null): RequestGovernor {
  return createRequestGovernor({ limit, windowMs, now: () => Date.now(), channelName })
}

describe("the request governor", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-28T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("lets the limit through at once and holds the next until the oldest leaves the window", async () => {
    const governor = governorOf(3, 60_000)
    const granted: number[] = []

    for (let index = 0; index < 4; index += 1) {
      void governor.acquire("interactive").then(() => granted.push(index))
    }

    await vi.advanceTimersByTimeAsync(0)
    expect(granted).toEqual([0, 1, 2])
    expect(governor.state().waiting).toBe(1)
    await vi.advanceTimersByTimeAsync(59_999)
    expect(granted).toEqual([0, 1, 2])
    await vi.advanceTimersByTimeAsync(1)
    expect(granted).toEqual([0, 1, 2, 3])
    governor.close()
  })

  it("serves a waiting interactive request before a background one", async () => {
    const governor = governorOf(1, 1_000)
    const order: string[] = []
    await governor.acquire("interactive")
    void governor.acquire("background").then(() => order.push("poll"))
    void governor.acquire("interactive").then(() => order.push("click"))
    await vi.advanceTimersByTimeAsync(1_000)
    expect(order).toEqual(["click"])
    await vi.advanceTimersByTimeAsync(1_000)
    expect(order).toEqual(["click", "poll"])
    governor.close()
  })

  it("holds every request until Retry-After has passed, and says so", async () => {
    const governor = governorOf(10, 60_000)
    const until = Date.now() + 30_000
    governor.holdUntil(until)
    expect(governor.state().heldUntil).toBe(until)
    let granted = false
    void governor.acquire("interactive").then(() => {
      granted = true
    })

    await vi.advanceTimersByTimeAsync(29_999)
    expect(granted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(granted).toBe(true)
    expect(governor.state().heldUntil).toBeNull()
    governor.close()
  })

  it("tells its listeners when a hold starts and when it ends", async () => {
    const governor = governorOf(10, 60_000)
    const seen: Array<number | null> = []
    governor.subscribe(() => seen.push(governor.state().heldUntil))
    const until = Date.now() + 5_000
    governor.holdUntil(until)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(seen).toEqual([until, null])
    governor.close()
  })

  it("drops an aborted waiter and rejects it with the signal's reason", async () => {
    const governor = governorOf(1, 60_000)
    await governor.acquire("interactive")
    const controller = new AbortController()
    const waiting = governor.acquire("background", controller.signal)
    expect(governor.state().waiting).toBe(1)
    const reason = new DOMException("left the page", "AbortError")
    controller.abort(reason)
    await expect(waiting).rejects.toBe(reason)
    expect(governor.state().waiting).toBe(0)
    governor.close()
  })
})

describe("the request governor across tabs", () => {
  it("counts what another tab spent, and honours its hold", async () => {
    const name = `kx-governor-test-${crypto.randomUUID()}`
    const first = governorOf(1, 400, name)
    const second = governorOf(1, 400, name)
    await first.acquire("interactive")
    await new Promise((resolve) => setTimeout(resolve, 30))
    const started = Date.now()
    await second.acquire("interactive")
    expect(Date.now() - started).toBeGreaterThanOrEqual(300)
    const until = Date.now() + 200
    first.holdUntil(until)
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(second.state().heldUntil).toBe(until)
    first.close()
    second.close()
  })
})
