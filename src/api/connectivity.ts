import type { ConnectivityState } from "../types/connectivity_state.type"

const listeners = new Set<() => void>()
let state: ConnectivityState = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  reachable: true
}

function update(next: Partial<ConnectivityState>): void {
  const merged = { ...state, ...next }
  if (merged.online === state.online && merged.reachable === state.reachable) {
    return
  }

  state = merged

  for (const listener of listeners) {
    listener()
  }
}

function reportReachable(reachable: boolean): void {
  update({ reachable })
}

function connectivity(): ConnectivityState {
  return state
}

function followNetwork(): () => void {
  function online(): void {
    update({ online: true })
  }

  function offline(): void {
    update({ online: false })
  }

  window.addEventListener("online", online)
  window.addEventListener("offline", offline)
  update({ online: navigator.onLine })

  return () => {
    window.removeEventListener("online", online)
    window.removeEventListener("offline", offline)
  }
}

function subscribeConnectivity(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export { connectivity, followNetwork, reportReachable, subscribeConnectivity }
