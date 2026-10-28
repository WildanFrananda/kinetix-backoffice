import { afterEach, describe, expect, it } from "vitest"
import { announceSession, listenForSessionSignals } from "../../src/features/session/session_channel"

let stop: (() => void) | null = null

afterEach(() => {
  stop?.()
  stop = null
})

describe("session channel", () => {
  it("tells other tabs about a sign-out and ignores anything else on the channel", async () => {
    const seen: unknown[] = []
    stop = listenForSessionSignals((signal) => seen.push(signal))
    const stranger = new BroadcastChannel("kx-backoffice-session")
    stranger.postMessage({ type: "drop-tables" })
    stranger.close()
    announceSession({ type: "signed-out" })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(seen).toEqual([{ type: "signed-out" }])
  })
})
