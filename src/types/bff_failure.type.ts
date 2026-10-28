type BffFailure =
  | {
      kind: "signed-out"
      code: "SESSION_REQUIRED" | "SESSION_ENDED"
      requestId: string | null
    }
  | {
      kind: "role-refused"
      requestId: string | null
    }
  | {
      kind: "csrf-refused"
      requestId: string | null
    }
  | {
      kind: "network-refused"
      requestId: string | null
    }
  | {
      kind: "rate-limited"
      scope: "address" | "route"
      code: string | null
      retryAfterSeconds: number | null
    }
  | {
      kind: "unavailable"
      status: number
      code: string | null
      requestId: string | null
    }
  | {
      kind: "refused"
      status: number
      code: string | null
      message: string
      requestId: string | null
    }
  | {
      kind: "unreadable"
      status: number
    }
  | {
      kind: "unreachable"
    }

export type { BffFailure }
