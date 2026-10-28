import type { GovernorState } from "./governor_state.type"
import type { RequestPriority } from "./request_priority.type"

type RequestGovernor = {
  acquire: (priority: RequestPriority, signal?: AbortSignal) => Promise<void>
  holdUntil: (instant: number) => void
  state: () => GovernorState
  subscribe: (listener: () => void) => () => void
  close: () => void
}

export type { RequestGovernor }
