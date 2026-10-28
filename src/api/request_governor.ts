import * as v from "valibot"
import type { GovernorMessage } from "../types/governor_message.type"
import type { GovernorOptions } from "../types/governor_options.type"
import type { GovernorState } from "../types/governor_state.type"
import type { RequestGovernor } from "../types/request_governor.type"
import type { RequestPriority } from "../types/request_priority.type"

type Waiter = {
  priority: RequestPriority
  resolve: () => void
  reject: (reason: unknown) => void
  detach: () => void
}

const messageSchema = v.variant("type", [
  v.object({ type: v.literal("spent"), at: v.number() }),
  v.object({ type: v.literal("held"), until: v.number() })
])

function openChannel(name: string | null): BroadcastChannel | null {
  if (name === null || typeof BroadcastChannel === "undefined") {
    return null
  }

  const channel = new BroadcastChannel(name)
  if ("unref" in channel && typeof channel.unref === "function") {
    channel.unref()
  }

  return channel
}

function createRequestGovernor(options: GovernorOptions): RequestGovernor {
  const spent: number[] = []
  const waiters: Waiter[] = []
  const listeners = new Set<() => void>()
  const channel = openChannel(options.channelName)
  let heldUntil = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let snapshot: GovernorState = { heldUntil: null, waiting: 0 }

  function notify(): void {
    const at = options.now()
    const next: GovernorState = { heldUntil: heldUntil > at ? heldUntil : null, waiting: waiters.length }
    if (next.heldUntil === snapshot.heldUntil && next.waiting === snapshot.waiting) {
      return
    }

    snapshot = next

    for (const listener of listeners) {
      listener()
    }
  }

  function record(at: number): void {
    let index = spent.length
    while (index > 0 && (spent[index - 1] ?? 0) > at) {
      index -= 1
    }

    spent.splice(index, 0, at)
  }

  function prune(at: number): void {
    while (spent.length > 0 && (spent[0] ?? 0) <= at - options.windowMs) {
      spent.shift()
    }
  }

  function freeAt(at: number): number {
    if (heldUntil > at) {
      return heldUntil
    }

    prune(at)

    if (spent.length < options.limit) {
      return at
    }

    return (spent[spent.length - options.limit] ?? at) + options.windowMs
  }

  function schedule(delay: number): void {
    if (timer !== null) {
      clearTimeout(timer)
    }

    timer = setTimeout(
      () => {
        timer = null
        drain()
      },
      Math.max(0, delay)
    )
  }

  function nextWaiter(): Waiter | undefined {
    const index = waiters.findIndex((waiter) => waiter.priority === "interactive")
    const [waiter] = waiters.splice(index === -1 ? 0 : index, 1)

    return waiter
  }

  function drain(): void {
    while (waiters.length > 0) {
      const at = options.now()
      const free = freeAt(at)
      if (free > at) {
        schedule(free - at)
        notify()

        return
      }

      const waiter = nextWaiter()
      if (waiter === undefined) {
        break
      }

      record(at)
      channel?.postMessage({ type: "spent", at } satisfies GovernorMessage)
      waiter.detach()
      waiter.resolve()
    }

    const at = options.now()
    if (heldUntil > at) {
      schedule(heldUntil - at)
    }

    notify()
  }

  function hold(until: number): void {
    if (until <= heldUntil) {
      return
    }

    heldUntil = until
    drain()
  }

  channel?.addEventListener("message", (event: MessageEvent<unknown>) => {
    const parsed = v.safeParse(messageSchema, event.data)
    if (!parsed.success) {
      return
    }

    if (parsed.output.type === "spent") {
      record(parsed.output.at)

      return
    }

    hold(parsed.output.until)
  })

  function acquire(priority: RequestPriority, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted === true) {
      return Promise.reject(signal.reason)
    }

    return new Promise<void>((resolve, reject) => {
      function abort(): void {
        const index = waiters.indexOf(waiter)
        if (index !== -1) {
          waiters.splice(index, 1)
        }

        reject(signal?.reason)
        notify()
      }

      const waiter: Waiter = {
        priority,
        resolve,
        reject,
        detach: () => signal?.removeEventListener("abort", abort)
      }

      signal?.addEventListener("abort", abort, { once: true })
      waiters.push(waiter)
      drain()
    })
  }

  function holdUntil(instant: number): void {
    channel?.postMessage({ type: "held", until: instant } satisfies GovernorMessage)
    hold(instant)
  }

  function state(): GovernorState {
    const at = options.now()
    if (snapshot.heldUntil !== null && snapshot.heldUntil <= at) {
      snapshot = { heldUntil: null, waiting: waiters.length }
    }

    return snapshot
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)

    return () => listeners.delete(listener)
  }

  function close(): void {
    if (timer !== null) {
      clearTimeout(timer)
    }

    channel?.close()

    for (const waiter of waiters.splice(0)) {
      waiter.detach()
      waiter.reject(new Error("the request governor closed"))
    }
  }

  return { acquire, holdUntil, state, subscribe, close }
}

export { createRequestGovernor }
