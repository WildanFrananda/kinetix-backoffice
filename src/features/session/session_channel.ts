import * as v from "valibot"
import type { SessionSignal } from "../../types/session_signal.type"

const channelName = "kx-backoffice-session"

const signalSchema = v.variant("type", [
  v.object({ type: v.literal("signed-in") }),
  v.object({ type: v.literal("signed-out") })
])

function listenForSessionSignals(onSignal: (signal: SessionSignal) => void): () => void {
  if (typeof BroadcastChannel === "undefined") {
    return () => undefined
  }
  const channel = new BroadcastChannel(channelName)
  channel.addEventListener("message", (event: MessageEvent<unknown>) => {
    const parsed = v.safeParse(signalSchema, event.data)
    if (parsed.success) {
      onSignal(parsed.output)
    }
  })
  return () => channel.close()
}

function announceSession(signal: SessionSignal): void {
  if (typeof BroadcastChannel === "undefined") {
    return
  }
  const channel = new BroadcastChannel(channelName)
  channel.postMessage(signal)
  channel.close()
}

export { announceSession, listenForSessionSignals }
